# GitHub Secrets Verification Guide

The deployment is failing because the `AZURE_WEBAPP_PUBLISH_PROFILE` secret cannot be found.

## Steps to Fix

### 1. Download the Publish Profile from Azure

1. Go to https://portal.azure.com
2. Navigate to your **myscheduling-api** App Service
3. In the Overview page, click **Download publish profile** (top toolbar)
4. This will download a file named: `myscheduling-api.PublishSettings`

### 2. Add/Update the GitHub Secret

1. Go to your GitHub repository: https://github.com/Aleut-Geoff-Vaughan/myScheduling
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Look for a secret named: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - If it exists: Click **Update**
   - If it doesn't exist: Click **New repository secret**
4. Name: `AZURE_WEBAPP_PUBLISH_PROFILE` (exact name, case-sensitive)
5. Value: Open the `.PublishSettings` file in a text editor and copy **the entire contents**
   - It should be XML starting with `<publishData>` and ending with `</publishData>`
   - Make sure to copy everything, including the opening and closing tags
6. Click **Add secret** or **Update secret**

### 3. Verify Other Required Secret

While you're there, also verify this secret exists:
- **VITE_API_URL**: Should be set to `https://myscheduling-api.azurewebsites.net/api`

### 4. Re-run the Workflow

After adding the secret:
1. Go to https://github.com/Aleut-Geoff-Vaughan/myScheduling/actions
2. Find the failed "Deploy Backend to Azure App Service" workflow
3. Click **Re-run jobs** → **Re-run failed jobs**

## Common Issues

### Issue: "No credentials found"
- **Cause**: The secret doesn't exist or has the wrong name
- **Fix**: Make sure the secret is named exactly `AZURE_WEBAPP_PUBLISH_PROFILE` (case-sensitive)

### Issue: "Invalid publish profile"
- **Cause**: The secret contains incomplete or incorrect XML
- **Fix**: Re-download the publish profile and ensure you copy the entire file contents

### Issue: Workflow still fails after adding secret
- **Cause**: Sometimes GitHub caches secrets
- **Fix**: Try updating the secret (delete and re-add it) or wait a few minutes and re-run

## What the Publish Profile Contains

The publish profile XML should look like this:
```xml
<publishData>
  <publishProfile profileName="myscheduling-api - Web Deploy"
    publishMethod="MSDeploy"
    publishUrl="myscheduling-api.scm.azurewebsites.net:443"
    msdeploySite="myscheduling-api"
    userName="$myscheduling-api"
    userPWD="..."
    ...
  />
  ...
</publishData>
```

Make sure you copy the **entire** XML file, not just a portion of it.
