// Define the UserProfilePhoto interface (add fields as needed)
export interface UserProfilePhoto {
  fileId: string; // Assuming this field represents the unique identifier of the photo
  fileUniqueId: string; // Assuming this field represents a unique identifier for the file
}

// Update the TelegramUser interface
export interface TelegramUser {
  id: string;                      // Unique identifier for this user or bot
  is_bot: boolean;                 // True, if this user is a bot
  first_name: string;              // User's or bot's first name
  last_name?: string;              // Optional. User's or bot's last name
  username?: string;               // Optional. User's bot's username
  language_code?: string;          // Optional. IETF language tag of the user's language
  is_premium?: boolean;            // Optional. True, if this user is a Telegram Premium user
  added_to_attachment_menu?: boolean; // Optional. True, if this user added the bot to the attachment menu
  can_join_groups?: boolean;       // Optional. True, if the bot can be invited to groups
  can_read_all_group_messages?: boolean; // Optional. True, if privacy mode is disabled for the bot
  supports_inline_queries?: boolean; // Optional. True, if the bot supports inline queries
  can_connect_to_business?: boolean; // Optional. True, if the bot can be connected to a Telegram Business account
  has_main_web_app?: boolean;     // Optional. True, if the bot has a main Web App
}


// Updated UserArgs interface
export interface UserArgs {
  readonly dateCreated: Date;
  readonly username: string | null; // Can be temporarily null
  readonly lastLoggedIn: Date; // Date UTC string
  readonly referralId: string | null; // Renamed from referral
  readonly telegramId: string | null; // Renamed from telegramid
  readonly walletId: string; // Renamed from telegramid
}

// User class definition
export default class User {
  dateCreated: Date;
  username: string | null; // Changed from firstname
  // lastName: string | null; // Changed from lastname
  // telegramHandle: string | null; // Changed from handle
  lastLoggedIn: Date;
  referralId: string | null; // Changed from referral
  telegramId: string | null; // Changed from telegramid
  walletId: string;
  // favoriteTokens: string[] | null;
  photoId?: string | null;
  photoUrl?: string | null;

  constructor(args: UserArgs | any) {
    // Handle date conversion for both server-side and client-side usage
    this.dateCreated = args.dateCreated instanceof Date 
      ? args.dateCreated 
      : new Date(args.dateCreated);
    
    this.username = args.username; // Changed to firstName
    // this.lastName = args.lastName; // Changed to lastName
    // this.telegramHandle = args.telegramHandle; // Changed to telegramHandle
    
    this.lastLoggedIn = args.lastLoggedIn instanceof Date 
      ? args.lastLoggedIn 
      : new Date(args.lastLoggedIn);
      
    this.referralId = args.referralId; // Changed to referralId
    this.telegramId = args.telegramId; // Changed to telegramId
    this.walletId = args.walletId; // Changed to telegramId
    // this.favoriteTokens = args.favoriteTokens;
    // this.photoId = args.photoId;
    // this.photoUrl = args.photoUrl;
  }
}

// FireStoreUser interface definition
export interface FireStoreUser extends Omit<UserArgs, "dateCreated" | "lastLoggedIn"> {
  readonly dateCreated: {
    readonly seconds: number;
    readonly nanoseconds: number;
  };
  readonly lastLoggedIn: {
    readonly seconds: number;
    readonly nanoseconds: number;
  };
}
