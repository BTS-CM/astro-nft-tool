import { type User, $userStorage, addUser, setCurrentUser, $currentUser } from "../stores/users.ts";

async function useInitCache() {
  if (!$currentUser || !$currentUser.get().username) {
    const storedUsers = $userStorage.get().users;
    const lastAccount = $userStorage.get().lastAccount;
    if (!storedUsers || !storedUsers.length) {
      // First visit by the user
      addUser("null-account", "1.2.3", "1.2.3", "bitshares");
      setCurrentUser("null-account", "1.2.3", "1.2.3", "bitshares");
    } else if (lastAccount && lastAccount.length) {
      // User has visited before
      const user: User = lastAccount[0];
      if (user && user.username && user.id && user.referrer && user.chain) {
        setCurrentUser(user.username, user.id, user.referrer, user.chain);
      }
    }
  }
}

export { useInitCache };
