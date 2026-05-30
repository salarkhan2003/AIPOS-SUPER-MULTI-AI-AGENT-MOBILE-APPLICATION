import { requireOptionalNativeModule } from 'expo-modules-core';

export type GhostAccessibilityModule = {
  tapByText(packageName: string, text: string): Promise<boolean>;
  typeInField(packageName: string, fieldText: string, value: string): Promise<boolean>;
  getScreenText(packageName: string): Promise<string>;
  isServiceEnabled(): Promise<boolean>;
  openAccessibilitySettings(): Promise<void>;
};

export default requireOptionalNativeModule<GhostAccessibilityModule>('GhostAccessibility');
