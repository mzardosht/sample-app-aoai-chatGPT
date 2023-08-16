import { ApplicationInsights } from '@microsoft/applicationinsights-web'  

/**
 * https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource/subscriptions/e1c5399f-3084-47cb-890c-bf78ce4bde4e/resourceGroups/OpenAI/providers/microsoft.insights/components/AI-Assistant-App-Insight/overview
 *
 * From the README for telemetry: "Don't worry about hardcoding [your instrumentation key], it is not sensitive."
 */
const APP_INSIGHTS_INSTRUMENTATION_KEY = "bd3879de-065e-4859-886e-6a7150039d3d";

const appInsights = new ApplicationInsights({config: { 
  instrumentationKey: APP_INSIGHTS_INSTRUMENTATION_KEY  
}});  
  
appInsights.loadAppInsights();  
appInsights.trackPageView();  
  
export default appInsights;  
