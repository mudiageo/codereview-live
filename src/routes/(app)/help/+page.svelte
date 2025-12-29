<script lang="ts">
  import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '$lib/components/ui/accordion';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
</script>

<div class="max-w-4xl mx-auto space-y-8 py-8 px-4">
  <div>
    <h1 class="text-4xl font-bold">Help & Support</h1>
    <p class="text-muted-foreground mt-2">
      Everything you need to know about CodeReview.live
    </p>
  </div>
  
  <section>
    <h2 class="text-2xl font-semibold mb-4">Getting Started</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card class="p-6">
        <h3 class="font-semibold mb-2">1. Connect GitHub</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Link your GitHub account once to import PRs without re-authenticating.
        </p>
        <Button href="/settings/integrations" size="sm" variant="secondary" class="w-full">Connect Now</Button>
      </Card>
      
      <Card class="p-6">
        <h3 class="font-semibold mb-2">2. Create Review</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Import from GitHub, upload files, or record a video review.
        </p>
        <Button href="/reviews/new" size="sm" class="w-full">Create Review</Button>
      </Card>
      
      <Card class="p-6">
        <h3 class="font-semibold mb-2">3. Collaborate</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Invite team members and review code together in real-time.
        </p>
        <Button href="/team" size="sm" variant="secondary" class="w-full">Invite Team</Button>
      </Card>
    </div>
  </section>
  
  <section>
    <h2 class="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
    <Accordion>
      <AccordionItem value="github-import">
        <AccordionTrigger>How do I import from GitHub?</AccordionTrigger>
        <AccordionContent>
          <ol class="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <strong>Settings → Integrations</strong></li>
            <li>Click "Connect GitHub" and authorize the app</li>
            <li>Your token is stored securely - you only do this once!</li>
            <li>Go to Create Review → GitHub tab</li>
            <li>Select repository and pull request</li>
            <li>Click "Import" and you're done!</li>
          </ol>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="video-recording">
        <AccordionTrigger>How do I record a video review?</AccordionTrigger>
        <AccordionContent>
          <p class="mb-2 text-sm">Recording a video review is easy:</p>
          <ol class="list-decimal list-inside space-y-2 text-sm">
            <li>Create a new review</li>
            <li>Go to the "Record" tab</li>
            <li>Choose what to capture (screen, window, or camera)</li>
            <li>Click "Start Recording"</li>
            <li>Explain your code while recording</li>
            <li>Use <strong>annotation tools</strong> to highlight important parts</li>
            <li>Click "Stop" when done</li>
            <li>Preview your video and save</li>
          </ol>
          <p class="mt-2 text-xs text-muted-foreground">
            Note: Video recording requires desktop browser with screen capture support.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="inline-comments">
        <AccordionTrigger>How do inline comments work?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm">Click any line number in the code view to add a comment on that specific line. You can:</p>
          <ul class="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Reply to comments to create a thread</li>
            <li>@mention team members for attention</li>
            <li>Mark threads as resolved when addressed</li>
            <li>Filter to see only unresolved conversations</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="plans">
        <AccordionTrigger>What's included in each plan?</AccordionTrigger>
        <AccordionContent>
          <ul class="space-y-4 text-sm">
            <li>
              <strong>Free:</strong> 5 reviews/month, basic features, 10 AI credits
            </li>
            <li>
              <strong>Pro ($20/mo):</strong> Unlimited reviews, cloud sync, advanced AI, priority support
            </li>
            <li>
              <strong>Team ($50/mo):</strong> Everything in Pro + team collaboration, SSO, analytics
            </li>
          </ul>
          <Button href="/settings/billing" size="sm" variant="link" class="mt-2 px-0">View Plans</Button>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="mobile">
        <AccordionTrigger>Can I use this on mobile?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm">Yes! The app is fully responsive and works on mobile devices. However:</p>
          <ul class="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Video recording is not available on mobile browsers (Android/iOS restrictions)</li>
            <li>You can upload pre-recorded videos from your phone</li>
            <li>All other features work perfectly on mobile</li>
            <li>Viewing reviews is optimized for smaller screens</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="bg-muted/50 p-8 rounded-lg border">
    <h2 class="text-2xl font-semibold mb-2">Still need help?</h2>
    <p class="text-muted-foreground mb-4">
      Our support team is here to help you get the most out of CodeReview.live
    </p>
    <div class="flex gap-4">
      <Button href="mailto:support@codereview.live">Email Support</Button>
      <Button variant="outline" href="https://github.com/mudiageo/codereview-live/issues" target="_blank">
        Report Bug
      </Button>
    </div>
  </section>
</div>