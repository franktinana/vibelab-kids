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

      // Load incoming friend requests
      const { data: requests } = await supabase
        .from("friend_requests")
        .select("id, requester_id, profiles!friend_requests_requester_id_fkey(handle)")
        .eq("recipient_id", user.id)
        .eq("status", "pending");

      if (requests) {
        setIncomingRequests(requests as unknown as FriendRequest[]);
      }

      // Load accepted friends
      const { data: friendships } = await supabase
        .from("friendships")
        .select("friend_id, profiles!friendships_friend_id_fkey(id, handle)")
        .eq("user_id", user.id);

      if (friendships) {
        const friendList = friendships.map((f: { profiles: { id: string; handle: string } }) => ({
          id: f.profiles.id,
          handle: f.profiles.handle,
        }));
        setFriends(friendList);
      }
    }
    load();
  }, []);

  const handleSearch = async () => {
    if (!searchHandle.trim()) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("id, handle")
      .eq("handle", searchHandle.trim())
      .single();

    if (data && data.id !== currentUserId) {
      // Check if already friends
      const isFriend = friends.some(f => f.id === data.id);
      if (isFriend) {
        setSearchResult("Already friends!");
        return;
      }

      // Send friend request
      const { error } = await supabase
        .from("friend_requests")
        .insert({ requester_id: currentUserId, recipient_id: data.id });

      if (error) {
        setSearchResult("Request already sent or error occurred.");
      } else {
        setSearchResult("Friend request sent!");
      }
    } else if (data?.id === currentUserId) {
      setSearchResult("That's you!");
    } else {
      setSearchResult("User not found.");
    }
    
    setTimeout(() => setSearchResult(null), 3000);
  };

  const acceptRequest = async (requestId: string, requesterId: string) => {
    await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    // Create friendship entries
    await supabase.from("friendships").insert([
      { user_id: currentUserId, friend_id: requesterId },
      { user_id: requesterId, friend_id: currentUserId },
    ]);

    // Refresh the page data
    window.location.reload();
  };

  const declineRequest = async (requestId: string) => {
    await supabase
      .from("friend_requests")
      .update({ status: "declined" })
      .eq("id", requestId);

    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-cyan-500 to-purple-600">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-white">👥 Friends</h1>
          <a
            href="/games"
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition"
          >
            ← Back
          </a>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 pb-8">
          {/* Search for Friends */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">🔍 Find Friends</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchHandle}
                onChange={(e) => setSearchHandle(e.target.value)}
                placeholder="Enter friend's handle"
                className="flex-1 bg-white/20 border-2 border-white/30 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:border-white focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="bg-sunshine text-ink font-bold rounded-xl px-6 py-2 hover:opacity-90 transition"
              >
                Search
              </button>
            </div>
            {searchResult && (
              <p className="mt-3 text-white/80 text-sm">{searchResult}</p>
            )}
          </div>

          {/* Incoming Requests */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">📬 Incoming Requests</h2>
            {incomingRequests.length === 0 ? (
              <p className="text-white/60">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white/20 rounded-xl p-4 flex items-center justify-between"
                  >
                    <span className="text-white font-medium">
                      @{req.profiles.handle}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(req.id, req.requester_id)}
                        className="bg-mint text-white px-4 py-1 rounded-lg text-sm hover:opacity-90 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineRequest(req.id)}
                        className="bg-red-500 text-white px-4 py-1 rounded-lg text-sm hover:opacity-90 transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Friends List */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">🤝 My Friends</h2>
            {friends.length === 0 ? (
              <p className="text-white/60">No friends yet. Search for friends above!</p>
            ) : (
              <div className="grid gap-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-white/20 rounded-xl p-4"
                  >
                    <span className="text-white font-medium">@{friend.handle}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
