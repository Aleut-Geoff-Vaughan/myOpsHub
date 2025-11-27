# Azure Authentication Setup for GitHub Actions

Your App Service has **Basic Authentication disabled**, so we need to choose an authentication method.

## Option 1: Enable Basic Authentication (EASIEST - 2 minutes)

### Steps:
1. Go to https://portal.azure.com
2. Navigate to **myscheduling-api** App Service
3. Click **Settings** → **Configuration**
4. Click the **General settings** tab
5. Scroll to **Platform settings** section
6. Find **Basic Auth Publishing Credentials** (or **SCM Basic Auth Publishing Credentials**)
7. Toggle it to **On**
8. Click **Save** at the top
9. Wait for the configuration to update (~30 seconds)
10. Click **Overview** and then **Download publish profile**
11. Add the publish profile contents to GitHub secret: `AZURE_WEBAPP_PUBLISH_PROFILE`

### Pros:
- Quick and simple
- Works immediately
- No additional Azure configuration needed

### Cons:
- Less secure than federated identity
- Uses username/password authentication

---

## Option 2: Federated Identity with Service Principal (MORE SECURE)

This is the modern, recommended approach but requires more setup.

### Step 1: Get Your Azure Subscription and Tenant IDs

Run these commands in Azure Cloud Shell or Azure CLI:
```bash
# Get subscription ID
az account show --query id -o tsv

# Get tenant ID
az account show --query tenantId -o tsv
```

### Step 2: Create a Service Principal

```bash
# Replace with your values
SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP="your-resource-group-name"  # The resource group containing myscheduling-api
APP_NAME="myscheduling-github-deploy"

# Create service principal
az ad sp create-for-rbac \
  --name $APP_NAME \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth
```

Save the output - you'll need it for GitHub secrets.

### Step 3: Configure Federated Identity

```bash
# Get the App ID from the previous step
APP_ID="<appId from previous command>"

# Create federated credential
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-deploy",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:Aleut-Geoff-Vaughan/myScheduling:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### Step 4: Add GitHub Secrets

Go to: https://github.com/Aleut-Geoff-Vaughan/myScheduling/settings/secrets/actions

Add these three secrets:

1. **AZURE_CLIENT_ID**: The `appId` from Step 2
2. **AZURE_TENANT_ID**: The `tenantId` from Step 1
3. **AZURE_SUBSCRIPTION_ID**: The subscription ID from Step 1

### Step 5: Remove Old Secret

Delete the `AZURE_WEBAPP_PUBLISH_PROFILE` secret (no longer needed).

### Pros:
- More secure (no passwords stored)
- Modern authentication method
- Better for enterprise environments

### Cons:
- More complex setup
- Requires Azure CLI knowledge
- Takes 10-15 minutes

---

## Recommendation

**For now: Use Option 1** (Enable Basic Auth)

Why?
- You need to test and verify the deployment works
- It's quick and gets you up and running
- You can always switch to federated identity later for better security

Once everything is working, you can revisit and migrate to Option 2 if needed.

---

## After Choosing an Option

Once you've set up authentication:

1. Commit and push the workflow changes (if using Option 2)
2. Go to: https://github.com/Aleut-Geoff-Vaughan/myScheduling/actions
3. Manually trigger the workflow or push a change to backend code
4. Verify the deployment succeeds
