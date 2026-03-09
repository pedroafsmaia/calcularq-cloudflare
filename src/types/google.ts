/** Google Identity Services (GIS) type definitions */

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
}

export interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

export interface GoogleButtonConfig {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: number;
  logo_alignment?: "left" | "center";
}

export interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void;
  renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
  prompt: () => void;
}

export interface GoogleAccounts {
  id: GoogleAccountsId;
}

export interface GoogleGlobal {
  google?: {
    accounts?: {
      id?: GoogleAccountsId;
    };
  };
}
