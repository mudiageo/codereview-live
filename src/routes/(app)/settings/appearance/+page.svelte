<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Slider } from '$lib/components/ui/slider';
  import { Switch } from '$lib/components/ui/switch';
  import { toast } from 'svelte-sonner';
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';
  import Monitor from '@lucide/svelte/icons/monitor';
  import Sunset from '@lucide/svelte/icons/sunset';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import { resetMode, setMode } from "mode-watcher";
  import { settingsStore } from '$lib/stores/index.svelte';
  import { EDITOR } from '$lib/constants';

  const settings = $derived(settingsStore.settings);
  let saving = $state(false);
  
  function updateSetting(key: keyof typeof settings, value: any) {
    settingsStore.update({ [key]: value });
    toast.success('Setting updated');
  }
  
  function handleThemeChange(value: string) {
    updateSetting('theme', value as 'light' | 'dark' | 'system');
    if (value === 'system') {
      resetMode();
    } else {
      setMode(value);
    }
  }
  
  async function handleSave() {
    saving = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Appearance settings saved');
    } finally {
      saving = false;
    }
  }
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold">Appearance</h2>
    <p class="text-muted-foreground">Customize the look and feel of the application</p>
  </div>

  <!-- Theme Selection -->
  <Card>
    <CardHeader>
      <CardTitle>Application Theme</CardTitle>
      <CardDescription>Choose between light, dark, or system theme</CardDescription>
    </CardHeader>
    <CardContent>
      <RadioGroup onValueChange={handleThemeChange} value={settings.theme} class="grid grid-cols-3 gap-4">
        <div>
          <RadioGroupItem value="light" id="light" class="peer sr-only" />
          <Label
            for="light"
            class="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
          >
            <Sun class="mb-3 h-6 w-6" />
            <span class="text-sm font-medium">Light</span>
          </Label>
        </div>
        <div>
          <RadioGroupItem value="dark" id="dark" class="peer sr-only" />
          <Label
            for="dark"
            class="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
          >
            <Moon class="mb-3 h-6 w-6" />
            <span class="text-sm font-medium">Dark</span>
          </Label>
        </div>
        <div>
          <RadioGroupItem value="system" id="system" class="peer sr-only" />
          <Label
            for="system"
            class="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
          >
            <Monitor class="mb-3 h-6 w-6" />
            <span class="text-sm font-medium">System</span>
          </Label>
        </div>
      </RadioGroup>
    </CardContent>
  </Card>

  <!-- Code Editor Appearance -->
  <Card>
    <CardHeader>
      <CardTitle>Code Editor Appearance</CardTitle>
      <CardDescription>Customize how code is displayed</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Font Size -->
      <div class="space-y-2">
        <Label>Font Size</Label>
        <div class="flex items-center gap-4">
          <Slider 
            value={[settings.fontSize]} 
            onValueChange={(value) => updateSetting('fontSize', value[0])}
            max={EDITOR.MAX_FONT_SIZE} 
            min={EDITOR.MIN_FONT_SIZE} 
            step={1} 
            class="flex-1" 
          />
          <span class="text-sm w-12 text-right">{settings.fontSize}px</span>
        </div>
      </div>
      
      <!-- Editor Theme -->
      <div class="space-y-2">
        <Label>Editor Color Theme</Label>
        <Select type="single" value={settings.editorTheme} onValueChange={(value) => updateSetting('editorTheme', value)}>
          <SelectTrigger>
            {settings.editorTheme || ""}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vscode-dark">VS Code Dark</SelectItem>
            <SelectItem value="vscode-light">VS Code Light</SelectItem>
            <SelectItem value="github-dark">GitHub Dark</SelectItem>
            <SelectItem value="github-light">GitHub Light</SelectItem>
            <SelectItem value="monokai">Monokai</SelectItem>
            <SelectItem value="dracula">Dracula</SelectItem>
            <SelectItem value="nord">Nord</SelectItem>
            <SelectItem value="solarized-dark">Solarized Dark</SelectItem>
            <SelectItem value="solarized-light">Solarized Light</SelectItem>
            <SelectItem value="one-dark">One Dark Pro</SelectItem>
            <SelectItem value="material-theme">Material Theme</SelectItem>
            <SelectItem value="cobalt">Cobalt</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>

  <!-- Code Editor Behavior -->
  <Card>
    <CardHeader>
      <CardTitle>Code Editor Behavior</CardTitle>
      <CardDescription>Configure editor features and behavior</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Line Numbers -->
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <Label>Line Numbers</Label>
          <p class="text-sm text-muted-foreground">Show line numbers in the editor</p>
        </div>
        <Switch 
          checked={settings.lineNumbers}
          onCheckedChange={(checked) => updateSetting('lineNumbers', checked)}
        />
      </div>

      <!-- Minimap -->
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <Label>Minimap</Label>
          <p class="text-sm text-muted-foreground">Show code minimap for navigation</p>
        </div>
        <Switch 
          checked={settings.minimap}
          onCheckedChange={(checked) => updateSetting('minimap', checked)}
        />
      </div>

      <!-- Word Wrap -->
      <div class="space-y-2">
        <Label>Word Wrap</Label>
        <Select type="single" value={settings.wordWrap} onValueChange={(value) => updateSetting('wordWrap', value)}>
          <SelectTrigger>
            {settings.wordWrap === 'off' ? 'Off' : 
             settings.wordWrap === 'on' ? 'On' : 
             settings.wordWrap === 'wordWrapColumn' ? 'At Column' : 'Bounded'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Off</SelectItem>
            <SelectItem value="on">On</SelectItem>
            <SelectItem value="wordWrapColumn">At Column</SelectItem>
            <SelectItem value="bounded">Bounded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Tab Size -->
      <div class="space-y-2">
        <Label>Tab Size</Label>
        <div class="flex items-center gap-4">
          <Slider 
            value={[settings.tabSize]} 
            onValueChange={(value) => updateSetting('tabSize', value[0])}
            max={8} 
            min={1} 
            step={1} 
            class="flex-1" 
          />
          <span class="text-sm w-12 text-right">{settings.tabSize} spaces</span>
        </div>
      </div>

      <!-- Insert Spaces -->
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <Label>Insert Spaces</Label>
          <p class="text-sm text-muted-foreground">Use spaces instead of tabs</p>
        </div>
        <Switch 
          checked={settings.insertSpaces}
          onCheckedChange={(checked) => updateSetting('insertSpaces', checked)}
        />
      </div>

      <!-- Render Whitespace -->
      <div class="space-y-2">
        <Label>Render Whitespace</Label>
        <Select type="single" value={settings.renderWhitespace} onValueChange={(value) => updateSetting('renderWhitespace', value)}>
          <SelectTrigger>
            {settings.renderWhitespace.charAt(0).toUpperCase() + settings.renderWhitespace.slice(1)}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="boundary">Boundary</SelectItem>
            <SelectItem value="selection">Selection</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Cursor Blinking -->
      <div class="space-y-2">
        <Label>Cursor Style</Label>
        <Select type="single" value={settings.cursorBlinking} onValueChange={(value) => updateSetting('cursorBlinking', value)}>
          <SelectTrigger>
            {settings.cursorBlinking.charAt(0).toUpperCase() + settings.cursorBlinking.slice(1)}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blink">Blink</SelectItem>
            <SelectItem value="smooth">Smooth</SelectItem>
            <SelectItem value="phase">Phase</SelectItem>
            <SelectItem value="expand">Expand</SelectItem>
            <SelectItem value="solid">Solid</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>

  <div class="flex justify-end">
    <Button onclick={handleSave} disabled={saving}>
      {saving ? 'Saving...' : 'All settings auto-save'}
    </Button>
  </div>
</div>