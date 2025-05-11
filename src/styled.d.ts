import 'styled-components';
 
declare module 'styled-components' {
  export interface DefaultTheme {
    primaryColor: string;
    isDarkMode: boolean;
    colors: {
      background: string;
      text: string;
      secondaryText: string;
      border: string;
      cardBackground: string;
      messageBackground: {
        user: string;
        assistant: string;
        error: string;
      };
      messageBorder: {
        user: string;
        assistant: string;
        error: string;
      };
      codeBackground: string;
      inputBackground: string;
      sidebarBackground: string;
      navbarBackground: string;
    }
  }
} 