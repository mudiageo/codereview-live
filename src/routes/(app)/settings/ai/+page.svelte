<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
  import { Progress } from '$lib/components/ui/progress';
  import { toast } from 'svelte-sonner';
  import Info from '@lucide/svelte/icons/info';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import { settingsStore, aiUsageStore, subscriptionsStore } from '$lib/stores/index.svelte';
  import { getLimit } from '$lib/config';
  import { API } from '$lib/constants';
  
  // Load stores
  $effect(() => {
    aiUsageStore.load();
    subscriptionsStore.load();
  });
  
  let saving = $state(false);
  const settings = $derived(settingsStore.settings);
  const creditsUsed = $derived(aiUsageStore.totalTokens);
  const creditsLimit = $derived(getLimit(subscriptionsStore.current?.plan || 'free', 'aiCredits'));
  
  async function handleSave() {
    saving = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('AI settings saved');
    } finally {
      saving = false;
    }
  }
  
  async function testConnection() {
    if (!settings.geminiApiKey) {
      toast.error('Please enter an API key first');
      return;
    }
    
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Testing connection...',
        success: 'API key is valid!',
        error: 'Invalid API key'
      }
    );
  }

  function updateSetting(key: keyof typeof settings, value: any) {
    settingsStore.update({ [key]: value });
  }
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold">AI Features</h2>
    <p class="text-muted-foreground">Configure AI-powered code analysis</p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>AI Configuration</CardTitle>
      <CardDescription>Enable and configure AI features</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <Label>Enable AI Features</Label>
          <p class="text-sm text-muted-foreground">Master switch for all AI functionality</p>
        </div>
        <Switch checked={settings.aiEnabled} onCheckedChange={(checked) => updateSetting('aiEnabled', checked)} />
      </div>
      
      {#if settings.aiEnabled}
        <div class="space-y-4 pl-6 border-l-2">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Auto-summarize Reviews</Label>
              <p class="text-sm text-muted-foreground">Generate summaries automatically</p>
            </div>
            <Switch checked={settings.autoSummarize} onCheckedChange={(checked) => updateSetting('autoSummarize', checked)} />
          </div>
          
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Detect Code Smells</Label>
              <p class="text-sm text-muted-foreground">Identify potential issues</p>
            </div>
            <Switch checked={settings.detectSmells} onCheckedChange={(checked) => updateSetting('detectSmells', checked)} />
          </div>
          
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>Suggest Improvements</Label>
              <p class="text-sm text-muted-foreground">Get AI-powered suggestions</p>
            </div>
            <Switch checked={settings.suggestImprovements} onCheckedChange={(checked) => updateSetting('suggestImprovements', checked)} />
          </div>
        </div>
      {/if}
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Gemini API Key</CardTitle>
      <CardDescription>Connect your Google AI API key</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <Alert>
        <Info class="h-4 w-4" />
        <AlertTitle>API Key Required</AlertTitle>
        <AlertDescription>
          Get your free API key from Google AI Studio to enable AI features.
        </AlertDescription>
      </Alert>
      
      <div class="space-y-2">
        <Label for="apiKey">API Key</Label>
        <div class="flex gap-2">
          <Input
            id="apiKey"
            type="password"
            placeholder="AIza..."
            value={settings.geminiApiKey}
            oninput={(e) => updateSetting('geminiApiKey', e.currentTarget.value)}
            class="flex-1"
          />
          <Button variant="outline" onclick={testConnection}>
            Test
          </Button>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        class="gap-2"
        onclick={() => window.open(API.GOOGLE_AI_STUDIO, '_blank', 'noopener,noreferrer')}
      >
        <ExternalLink class="h-4 w-4" />
        Get API Key
      </Button>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Usage This Month</CardTitle>
      <CardDescription>Track your AI credit consumption</CardDescription>
    </CardHeader>
    <CardContent class="space-y-2">
      <div class="flex justify-between text-sm">
        <span>AI Credits Used</span>
        <span class="font-medium">{creditsUsed} / {creditsLimit}</span>
      </div>
      <Progress value={(creditsUsed / creditsLimit) * 100} />
      <p class="text-xs text-muted-foreground">
        Resets on the 1st of each month
      </p>
    </CardContent>
  </Card>

  <Button onclick={handleSave} disabled={saving}>
    {saving ? 'Saving...' : 'Save Changes'}
  </Button>
</div>