import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Update {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useUpdates = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from("updates")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUpdates(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUpdates();

    const channel = supabase
      .channel("updates-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "updates" },
        () => fetchUpdates()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { updates, loading, refetch: fetchUpdates };
};
