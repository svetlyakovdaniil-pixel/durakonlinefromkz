/**
 * CodePush Configuration
 * 
 * CodePush allows you to deploy updates to your app without going through the app stores.
 * 
 * Setup:
 * 1. Create AppCenter account: https://appcenter.ms
 * 2. Create an app for each platform (iOS and Android)
 * 3. Get deployment keys from AppCenter
 * 4. Set environment variables:
 *    - CODEPUSH_IOS_KEY=<your-ios-deployment-key>
 *    - CODEPUSH_ANDROID_KEY=<your-android-deployment-key>
 * 
 * Publishing updates:
 * - pnpm build
 * - code-push release-react durak-online-kz-ios ios
 * - code-push release-react durak-online-kz-android android
 */

export const codePushConfig = {
  // iOS deployment key (from AppCenter)
  iosDeploymentKey: process.env.CODEPUSH_IOS_KEY || 'YOUR_IOS_KEY_HERE',
  
  // Android deployment key (from AppCenter)
  androidDeploymentKey: process.env.CODEPUSH_ANDROID_KEY || 'YOUR_ANDROID_KEY_HERE',
  
  // Check frequency (in milliseconds)
  checkFrequency: 6 * 60 * 60 * 1000, // 6 hours
  
  // Update dialog options
  updateDialog: {
    title: 'Доступно обновление',
    optionalUpdateMessage: 'Новая версия приложения готова. Установить?',
    optionalInstallButtonLabel: 'Установить',
    optionalIgnoreButtonLabel: 'Позже',
    mandatoryUpdateMessage: 'Требуется обновление приложения для продолжения.',
    mandatoryInstallButtonLabel: 'Установить',
    mandatoryContinueButtonLabel: 'Продолжить',
  },
};

export default codePushConfig;
