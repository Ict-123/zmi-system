import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "GET") {
      const {
        data: { users },
        error: usersError,
      } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

      if (usersError) throw usersError;

      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role");

      const { data: profiles } = await adminClient
        .from("user_profiles")
        .select("user_id, full_name, student_id");

      const roleMap: Record<string, string> = {};
      for (const r of roles || []) {
        roleMap[r.user_id] = r.role;
      }

      const profileMap: Record<string, { full_name: string; student_id: string }> = {};
      for (const p of profiles || []) {
        profileMap[p.user_id] = { full_name: p.full_name || "", student_id: p.student_id || "" };
      }

      const result = users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        role: roleMap[u.id] || null,
        full_name: profileMap[u.id]?.full_name || "",
        student_id: profileMap[u.id]?.student_id || "",
      }));

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();

      // Create new account
      if (action === "create-account") {
        const { email, password, role, full_name, student_id } = body;

        if (!email || !password || !role) {
          return new Response(
            JSON.stringify({ error: "email, password, and role are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!["admin", "teacher", "student", "parent"].includes(role)) {
          return new Response(
            JSON.stringify({ error: "Invalid role" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Assign role
        await adminClient.from("user_roles").insert({
          user_id: newUser.user.id,
          role,
        });

        // Create profile
        await adminClient.from("user_profiles").insert({
          user_id: newUser.user.id,
          full_name: full_name || "",
          student_id: student_id || "",
        });

        return new Response(
          JSON.stringify({ success: true, user_id: newUser.user.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Link parent to student
      if (action === "link-parent") {
        const { parent_user_id, student_id } = body;
        if (!parent_user_id || !student_id) {
          return new Response(
            JSON.stringify({ error: "parent_user_id and student_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await adminClient.from("parent_student_links").insert({
          parent_user_id,
          student_id,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update role (existing)
      const { user_id, role } = body;

      if (!user_id || !role) {
        return new Response(
          JSON.stringify({ error: "user_id and role are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!["admin", "teacher", "student", "parent"].includes(role)) {
        return new Response(
          JSON.stringify({ error: "Invalid role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      const { error: insertError } = await adminClient
        .from("user_roles")
        .insert({ user_id, role });

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const { user_id } = await req.json();
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await adminClient.from("user_roles").delete().eq("user_id", user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
