<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
  import { Slider } from '$lib/components/ui/slider';
  import { toast } from 'svelte-sonner';
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';
  import Monitor from '@lucide/svelte/icons/monitor';
  
  let theme = $state('dark');
  let editorTheme = $state('vscode-dark');
  let fontSize = $state([14]);
  let saving = $state(false);
  
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
    <p class="text-muted-foreground">Customize the look and feel</p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Theme</CardTitle>
      <CardDescription>Select your preferred theme</CardDescription>
    </CardHeader>
    <CardContent>
      <RadioGroup bind:value={theme} class="grid grid-cols-3 gap-4">
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

  <Card>
    <CardHeader>
      <CardTitle>Editor Settings</CardTitle>
      <CardDescription>Customize the code editor appearance</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="space-y-2">
        <Label>Font Size</Label>
        <div class="flex items-center gap-4">
          <Slider bind:value={fontSize} max={20} min={10} step={1} class="flex-1" />
          <span class="text-sm w-12 text-right">{fontSize[0]}px</span>
        </div>
      </div>
      
      <div class="space-y-2">
        <Label>Editor Theme</Label>
        <Select bind:value={editorTheme}>
          <SelectTrigger>
            {editorTheme || ""}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vscode-dark">VS Code Dark</SelectItem>
            <SelectItem value="github-dark">GitHub Dark</SelectItem>
            <SelectItem value="monokai">Monokai</SelectItem>
            <SelectItem value="dracula">Dracula</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onclick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </CardContent>
  </Card>
</div>