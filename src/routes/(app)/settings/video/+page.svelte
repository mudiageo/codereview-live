<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Slider } from '$lib/components/ui/slider';
  import { toast } from 'svelte-sonner';
  import { settingsStore } from '$lib/stores/index.svelte';
  
  const settings = $derived(settingsStore.settings);
  let saving = $state(false);
  
  function updateSetting(key: keyof typeof settings, value: any) {
    settingsStore.update({ [key]: value });
  }
  
  async function handleSave() {
    saving = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Video settings saved');
    } finally {
      saving = false;
    }
  }
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold">Video Settings</h2>
    <p class="text-muted-foreground">Configure video recording and playback</p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Recording Settings</CardTitle>
      <CardDescription>Customize video recording options</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <Label>Auto-compress Videos</Label>
          <p class="text-sm text-muted-foreground">Reduce file size after recording</p>
        </div>
        <Switch checked={settings.autoCompress} onCheckedChange={(checked) => updateSetting('autoCompress', checked)} />
      </div>
      
      <div class="space-y-2">
        <Label>Video Quality</Label>
        <Select type="single" value={settings.videoQuality} onValueChange={(value) => updateSetting('videoQuality', value as 'low' | 'medium' | 'high')}>
          <SelectTrigger>
            {settings.videoQuality || ""}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High (best quality)</SelectItem>
            <SelectItem value="medium">Medium (balanced)</SelectItem>
            <SelectItem value="low">Low (smallest size)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div class="space-y-2">
        <Label>Max Video Size</Label>
        <div class="flex items-center gap-4">
          <Slider 
            value={[settings.maxVideoSize]} 
            onValueChange={(value) => updateSetting('maxVideoSize', value[0])}
            max={500} 
            min={50} 
            step={10} 
            class="flex-1" 
          />
          <span class="text-sm w-16 text-right">{settings.maxVideoSize} MB</span>
        </div>
      </div>
      
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <Label>Include Audio by Default</Label>
          <p class="text-sm text-muted-foreground">Record system and microphone audio</p>
        </div>
        <Switch checked={settings.includeAudio} onCheckedChange={(checked) => updateSetting('includeAudio', checked)} />
      </div>
      
      <div class="space-y-2">
        <Label>Countdown Duration</Label>
        <Select type="single" value={settings.countdown.toString()} onValueChange={(value) => updateSetting('countdown', parseInt(value))}>
          <SelectTrigger>
            {settings.countdown.toString() || ""}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">No countdown</SelectItem>
            <SelectItem value="3">3 seconds</SelectItem>
            <SelectItem value="5">5 seconds</SelectItem>
            <SelectItem value="10">10 seconds</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Playback Settings</CardTitle>
      <CardDescription>Customize video playback experience</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="space-y-2">
        <Label>Default Playback Speed</Label>
        <Select type="single" value={settings.defaultSpeed.toString()} onValueChange={(value) => updateSetting('defaultSpeed', parseFloat(value))}>
          <SelectTrigger>
            {settings.defaultSpeed.toString() || ""}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5">0.5x</SelectItem>
            <SelectItem value="1">1x (Normal)</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <Label>Auto-play Next Review</Label>
          <p class="text-sm text-muted-foreground">Automatically play next review in queue</p>
        </div>
        <Switch checked={settings.autoplay} onCheckedChange={(checked) => updateSetting('autoplay', checked)} />
      </div>

      <Button onclick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </CardContent>
  </Card>
</div>