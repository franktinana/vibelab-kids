"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthGate from "@/components/AuthGate";

type FriendRequest = {
  id: string;
  requester_id: string;
  profiles: { handle: string };
};

type Friend = {
  id: string;
  handle: string;
};

export default function FriendsPage() {
  const [searchHandle, setSearchHandle] = useState("");
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Incoming requests
      const { data: requests } = await supabase
        .from("friendships")
        .select("id, requester_id, profiles:requester_id(handle)")
        .eq("addressee_id", user.id)
        .eq("status", "pending");
      
      if (requests) {
        setIncomingRequests(requests as unknown as FriendRequest[]);
      }

      // Accepted friends
      const { data: friendRows } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id, req:requester_id(handle), addr:addressee_id(handle)")
        .eq("status", "accepted")
                .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (friendRows) {
        const friendList: Friend[] = friendRows.map((row: { requester_id: string; addressee_id: string; req: { handle: string }; addr: { handle: string } }) =>
          row.requester_id === user.id
            ? { id: row.addressee_id, handle: row.addr.handle }
            : { id: row.requester_id, handle: row.req.handle }
        );
        setFriends(friendList);
      }
    }
    load();
  }, []);

  async function handleSearch() {
    const { data } = await supabase
      .from("profile_directory")
      .select("user_id")
      .eq("handle", searchHandle)
      .maybeSingle();

    if (data) {
      await supabase.from("friendships").insert({
        requester_id: currentUserId,
        addressee_id: data.user_id,
        status: "pending",
      });
      setSearchResult("Friend request sent!");
    } else {
      setSearchResult("Handle not found");
    }
  }

  async function acceptRequest(id: string) {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-purple-600 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Friends</h1>
            <button
              onClick={() => window.location.href = "/games"}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg border border-white/30 transition"
            >
              Back
            </button>
          </div>

          {/* Search for friends */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Add Friend</h2>
            <div className="flex gap-3">
              <input
                placeholder="Search by handle..."
                value={searchHandle}
                onChange={(e) => setSearchHandle(e.target.value)}
                className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-sunshine hover:bg-yellow-500 text-ink font-semibold rounded-lg transition"
              >
                Search
              </button>
            </div>
            {searchResult && (
              <p className="mt-3 text-white/80">{searchResult}</p>
            )}
          </div>

          {/* Incoming Requests */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Incoming Requests</h2>
            {incomingRequests.length === 0 ? (
              <p className="text-white/60">No pending requests</p>
            ) : (
              <ul className="space-y-3">
                {incomingRequests.map((req) => (
                  <li key={req.id} className="flex justify-between items-center bg-white/10 rounded-lg p-3">
                    <span className="text-white">{req.profiles.handle}</span>
                    <button
                      onClick={() => acceptRequest(req.id)}
                      className="px-4 py-1 bg-mint hover:bg-green-600 text-white rounded-lg transition"
                    >
                      Accept
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Friends List */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Your Friends</h2>
            {friends.length === 0 ? (
              <p className="text-white/60">No friends yet</p>
            ) : (
              <ul className="space-y-2">
                {friends.map((f) => (
                  <li key={f.id} className="bg-white/10 rounded-lg p-3 text-white">
                    {f.handle}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
