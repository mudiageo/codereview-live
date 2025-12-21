<script lang="ts">
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { Badge } from '$lib/components/ui/badge';
  import { Progress } from '$lib/components/ui/progress';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import Share2 from '@lucide/svelte/icons/share-2';
  import Copy from '@lucide/svelte/icons/copy';
  import Check from '@lucide/svelte/icons/check';
  import Users from '@lucide/svelte/icons/users';
  import Lock from '@lucide/svelte/icons/lock';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import { P2PSharing } from '$lib/utils/p2p-sharing';
  import { toast } from 'svelte-sonner';

  interface Props {
    open: boolean;
    onClose: () => void;
    reviewData?: any;
  }

  let { open = $bindable(), onClose, reviewData }: Props = $props();

  let mode = $state<'send' | 'receive'>('send');
  let p2p = $state<P2PSharing | null>(null);
  let peerId = $state('');
  let targetPeerId = $state('');
  let connectionStatus = $state<'idle' | 'initializing' | 'connected' | 'error'>('idle');
  let transferProgress = $state(0);
  let encrypt = $state(false);
  let copied = $state(false);
  let initializing = $state(false);

  async function initialize() {
    initializing = true;
    connectionStatus = 'initializing';

    try {
      p2p = new P2PSharing();
      
      p2p.setCallbacks({
        onConnect: () => {
          connectionStatus = 'connected';
          toast.success('Connected to peer');
        },
        onDisconnect: () => {
          connectionStatus = 'idle';
          toast.info('Peer disconnected');
        },
        onProgress: (progress) => {
          transferProgress = progress;
        },
        onComplete: () => {
          transferProgress = 100;
          toast.success('Transfer complete');
          setTimeout(() => {
            handleClose();
          }, 2000);
        },
        onError: (error) => {
          connectionStatus = 'error';
          toast.error(error.message);
        },
        onReceive: (data) => {
          toast.success('Review received successfully');
          console.log('Received data:', data);
          // Could trigger import flow here
        }
      });

      const id = await p2p.initialize();
      peerId = id;
      connectionStatus = 'idle';
    } catch (error) {
      connectionStatus = 'error';
      toast.error('Failed to initialize P2P connection');
      console.error(error);
    } finally {
      initializing = false;
    }
  }

  async function connect() {
    if (!p2p || !targetPeerId.trim()) {
      toast.error('Please enter a peer ID');
      return;
    }

    try {
      await p2p.connect(targetPeerId);
    } catch (error) {
      toast.error('Failed to connect to peer');
      console.error(error);
    }
  }

  async function sendReview() {
    if (!p2p || connectionStatus !== 'connected' || !reviewData) {
      toast.error('No active connection or review data');
      return;
    }

    try {
      await p2p.sendReview(reviewData, encrypt);
    } catch (error) {
      toast.error('Failed to send review');
      console.error(error);
    }
  }

  async function copyPeerId() {
    try {
      await navigator.clipboard.writeText(peerId);
      copied = true;
      toast.success('Peer ID copied to clipboard');
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy peer ID');
    }
  }

  function handleClose() {
    if (p2p) {
      p2p.disconnect();
    }
    open = false;
    onClose();
    
    // Reset state after animation
    setTimeout(() => {
      p2p = null;
      peerId = '';
      targetPeerId = '';
      connectionStatus = 'idle';
      transferProgress = 0;
      encrypt = false;
      mode = 'send';
    }, 300);
  }

  // Initialize when dialog opens
  $effect(() => {
    if (open && !p2p) {
      initialize();
    }
  });
</script>

<Dialog bind:open>
  <DialogContent class="max-w-lg">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <Share2 class="h-5 w-5" />
        Peer-to-Peer Sharing
      </DialogTitle>
      <DialogDescription>
        Share reviews directly with another user without a server
      </DialogDescription>
    </DialogHeader>

    <Tabs value={mode} onValueChange={(v) => (mode = v as 'send' | 'receive')}>
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="send">Send Review</TabsTrigger>
        <TabsTrigger value="receive">Receive Review</TabsTrigger>
      </TabsList>

      <TabsContent value="send" class="space-y-4 mt-4">
        {#if initializing}
          <div class="flex items-center justify-center py-8">
            <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        {:else if connectionStatus === 'error'}
          <div class="text-center py-8 space-y-4">
            <p class="text-sm text-destructive">Failed to initialize P2P connection</p>
            <Button onclick={initialize}>Try Again</Button>
          </div>
        {:else}
          <!-- Your Peer ID -->
          <div class="space-y-2">
            <Label>Your Peer ID</Label>
            <div class="flex gap-2">
              <Input value={peerId} readonly class="font-mono text-xs" />
              <Button variant="outline" size="icon" onclick={copyPeerId}>
                {#if copied}
                  <Check class="h-4 w-4" />
                {:else}
                  <Copy class="h-4 w-4" />
                {/if}
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">
              Share this ID with the recipient
            </p>
          </div>

          {#if connectionStatus === 'idle'}
            <!-- Connect to Peer -->
            <div class="space-y-2">
              <Label for="target-peer">Recipient's Peer ID</Label>
              <Input
                id="target-peer"
                bind:value={targetPeerId}
                placeholder="Enter peer ID..."
                class="font-mono text-xs"
                onkeydown={(e) => e.key === 'Enter' && connect()}
              />
            </div>

            <!-- Encryption Option -->
            <div class="flex items-center justify-between rounded-lg border p-3">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2 text-sm font-medium">
                  <Lock class="h-4 w-4" />
                  Encrypt Transfer
                </div>
                <p class="text-xs text-muted-foreground">
                  End-to-end encryption for secure transfer
                </p>
              </div>
              <Switch bind:checked={encrypt} />
            </div>

            <Button onclick={connect} disabled={!targetPeerId.trim()} class="w-full">
              <Users class="h-4 w-4 mr-2" />
              Connect to Peer
            </Button>
          {:else if connectionStatus === 'initializing'}
            <div class="flex items-center justify-center py-8">
              <Loader2 class="h-6 w-6 animate-spin" />
              <span class="ml-2 text-sm">Connecting...</span>
            </div>
          {:else if connectionStatus === 'connected'}
            <div class="space-y-4">
              <div class="rounded-lg border p-4 text-center">
                <Badge variant="default" class="mb-2">
                  <Check class="h-3 w-3 mr-1" />
                  Connected
                </Badge>
                <p class="text-sm text-muted-foreground">
                  Ready to send review
                </p>
              </div>

              {#if transferProgress > 0}
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span>Transferring...</span>
                    <span>{Math.round(transferProgress)}%</span>
                  </div>
                  <Progress value={transferProgress} />
                </div>
              {/if}

              <Button onclick={sendReview} disabled={transferProgress > 0} class="w-full">
                <Share2 class="h-4 w-4 mr-2" />
                Send Review
              </Button>
            </div>
          {/if}
        {/if}
      </TabsContent>

      <TabsContent value="receive" class="space-y-4 mt-4">
        {#if initializing}
          <div class="flex items-center justify-center py-8">
            <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        {:else}
          <!-- Your Peer ID for receiving -->
          <div class="space-y-2">
            <Label>Your Peer ID</Label>
            <div class="flex gap-2">
              <Input value={peerId} readonly class="font-mono text-xs" />
              <Button variant="outline" size="icon" onclick={copyPeerId}>
                {#if copied}
                  <Check class="h-4 w-4" />
                {:else}
                  <Copy class="h-4 w-4" />
                {/if}
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">
              Share this ID with the sender
            </p>
          </div>

          {#if connectionStatus === 'connected'}
            <div class="space-y-4">
              <div class="rounded-lg border p-4 text-center">
                <Badge variant="default" class="mb-2">
                  <Check class="h-3 w-3 mr-1" />
                  Connected
                </Badge>
                <p class="text-sm text-muted-foreground">
                  Waiting to receive review...
                </p>
              </div>

              {#if transferProgress > 0}
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span>Receiving...</span>
                    <span>{Math.round(transferProgress)}%</span>
                  </div>
                  <Progress value={transferProgress} />
                </div>
              {/if}
            </div>
          {:else}
            <div class="rounded-lg border p-8 text-center">
              <Users class="mx-auto h-12 w-12 opacity-20" />
              <p class="mt-4 text-sm text-muted-foreground">
                Waiting for connection...
              </p>
            </div>
          {/if}
        {/if}
      </TabsContent>
    </Tabs>

    <div class="flex gap-2 pt-2">
      <Button variant="outline" onclick={handleClose} class="w-full">
        Close
      </Button>
    </div>
  </DialogContent>
</Dialog>
