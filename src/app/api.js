import { supabase } from "../supabase";
import { randomCode } from "./utils";


export async function getProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}
export async function upsertProfile(profile) {
  await supabase.from("profiles").upsert(profile);
}
export async function getMyGroups(userId) {
  const { data } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, code, created_by)")
    .eq("user_id", userId);
  return (data || []).map(r => r.groups).filter(Boolean);
}
export async function getGroupMembers(groupId) {
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  if (!members || members.length === 0) return [];
  const ids = members.map(m => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, color, avatar")
    .in("id", ids);
  return profiles || [];
}
export async function getGroupEvents(groupId) {
  const { data } = await supabase.from("events").select("data").eq("group_id", groupId).single();
  return data?.data || [];
}
export async function saveGroupEvents(groupId, events) {
  await supabase.from("events").upsert({ group_id: groupId, data: events });
}
export async function createGroup(name, userId) {
  const code = randomCode();
  const { data, error } = await supabase.from("groups").insert({ name, code, created_by: userId }).select().single();
  if (error) throw error;
  await supabase.from("group_members").insert({ group_id: data.id, user_id: userId });
  await supabase.from("events").insert({ group_id: data.id, data: [] });
  return data;
}
export async function joinGroup(code, userId) {
  const { data: group, error } = await supabase.from("groups").select("*").eq("code", code.toUpperCase()).single();
  if (error || !group) throw new Error("Código inválido");
  const { data: existing } = await supabase.from("group_members").select("*").eq("group_id", group.id).eq("user_id", userId).single();
  if (existing) throw new Error("Ya sos miembro de este grupo");
  await supabase.from("group_members").insert({ group_id: group.id, user_id: userId });
  return group;
}

