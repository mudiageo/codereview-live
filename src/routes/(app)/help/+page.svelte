<script lang="ts">
	import {
		Accordion,
		AccordionItem,
		AccordionTrigger,
		AccordionContent
	} from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
</script>

<div class="max-w-4xl mx-auto space-y-8 py-8 px-4">
	<div>
		<h1 class="text-4xl font-bold">Help & Support</h1>
		<p class="text-muted-foreground mt-2">Everything you need to know about CodeReview.live</p>
	</div>

	<section>
		<h2 class="text-2xl font-semibold mb-4">Getting Started</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Card class="p-6">
				<h3 class="font-semibold mb-2">1. Connect GitHub</h3>
				<p class="text-sm text-muted-foreground mb-4">
					Link your GitHub account once to import PRs without re-authenticating.
				</p>
				<Button href="/settings/integrations" size="sm" variant="secondary" class="w-full"
					>Connect Now</Button
				>
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
					<p class="text-sm">
						Click any line number in the code view to add a comment on that specific line. You can:
					</p>
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
					<Button href="/settings/billing" size="sm" variant="link" class="mt-2 px-0"
						>View Plans</Button
					>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="mobile">
				<AccordionTrigger>Can I use this on mobile?</AccordionTrigger>
				<AccordionContent>
					<p class="text-sm">
						Yes! The app is fully responsive and works on mobile devices. However:
					</p>
					<ul class="list-disc list-inside mt-2 space-y-1 text-sm">
						<li>Video recording is not available on mobile browsers (Android/iOS restrictions)</li>
						<li>You can upload pre-recorded videos from your phone</li>
						<li>All other features work perfectly on mobile</li>
						<li>Viewing reviews is optimized for smaller screens</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="ai-assistant">
				<AccordionTrigger>How do I use the AI Assistant?</AccordionTrigger>
				<AccordionContent>
					<p class="text-sm">
						Our AI Code Review Assistant helps you find bugs and improve code quality:
					</p>
					<ul class="list-disc list-inside mt-2 space-y-1 text-sm">
						<li>Paste your code in the review editor</li>
						<li>The AI panel will appear on the right (or bottom on mobile)</li>
						<li>Click <strong>"Analyze Code"</strong> to get a full report</li>
						<li>Review bugs, security issues, and suggestions</li>
						<li>Use the <strong>Smart Checklist</strong> to auto-verify common requirements</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="voice-nav">
				<AccordionTrigger>What is Voice-Over Code Navigation?</AccordionTrigger>
				<AccordionContent>
					<p class="text-sm">We sync your voice with your code navigation:</p>
					<ul class="list-disc list-inside mt-2 space-y-1 text-sm">
						<li>Start recording your review</li>
						<li>Scroll through the code as you explain it</li>
						<li>We record your scroll position automatically</li>
						<li>
							When viewers watch your video, the code editor scrolls automatically to match your
							explanation!
						</li>
						<li>No more saying "if you look at line 50..." - just go there!</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="smart-chapters">
				<AccordionTrigger>What are Smart Chapters?</AccordionTrigger>
				<AccordionContent>
					<p class="text-sm">Smart Chapters make navigating multi-file reviews effortless:</p>
					<ul class="list-disc list-inside mt-2 space-y-1 text-sm">
						<li>
							<strong>Automatic Detection:</strong> When you switch files during a recording, we automatically
							mark it.
						</li>
						<li>
							<strong>Smart Navigation:</strong> During playback, the workspace automatically switches
							to the file being discussed.
						</li>
						<li>
							<strong>Timeline Markers:</strong> See exactly which file is being discussed at any point
							in the video timeline.
						</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="live-collaboration">
				<AccordionTrigger>How does Live Collaboration work?</AccordionTrigger>
				<AccordionContent>
					<p class="text-sm">Collaborate with your team in real-time just like in Google Docs:</p>
					<ul class="list-disc list-inside mt-2 space-y-1 text-sm">
						<li>
							<strong>Presence Indicators:</strong> See who is currently viewing the review with live avatars in the top bar.
						</li>
						<li>
							<strong>Live Cursors:</strong> See your teammates' cursors moving over the code in real-time.
						</li>
						<li>
							<strong>Instant Updates:</strong> Comments and code selections are synced instantly across all connected users.
						</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="ai-summary">
				<AccordionTrigger>What is the AI Executive Summary?</AccordionTrigger>
				<AccordionContent>
					<p class="text-sm">Get a high-level overview of any review instantly:</p>
					<ul class="list-disc list-inside mt-2 space-y-1 text-sm">
						<li>
							<strong>Instant Context:</strong> AI generates a concise summary of all changes in the review.
						</li>
						<li>
							<strong>Premium Insight:</strong> Displayed in a beautiful summary card at the top of the
							review.
						</li>
						<li>
							<strong>Always Up-to-Date:</strong> Re-run analysis to update the summary as the review
							evolves.
						</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="storage">
				<AccordionTrigger>Where are my videos stored?</AccordionTrigger>
				<AccordionContent>
					<p class="text-sm">We support flexible storage options:</p>
					<ul class="list-disc list-inside mt-2 space-y-1 text-sm">
						<li>
							<strong>Local Storage:</strong> Default. Videos are stored directly on the server. Good
							for privacy and low cost.
						</li>
						<li>
							<strong>Cloud Storage:</strong> Configure S3 or R2 buckets in Settings. Ideal for teams
							and scaling.
						</li>
						<li>You can choose your storage preference before uploading each video review.</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="keyboard-shortcuts">
				<AccordionTrigger>What keyboard shortcuts are available?</AccordionTrigger>
				<AccordionContent>
					<p class="text-sm mb-3">
						Use these shortcuts during video recording for faster workflow:
					</p>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div class="space-y-2">
							<h4 class="font-semibold">Recording Controls</h4>
							<div class="space-y-1.5">
								<div class="flex justify-between items-center">
									<span class="text-muted-foreground">Start Recording</span><kbd
										class="bg-muted px-2 py-0.5 rounded text-xs">R</kbd
									>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-muted-foreground">Stop Recording</span><kbd
										class="bg-muted px-2 py-0.5 rounded text-xs">S</kbd
									>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-muted-foreground">Pause/Resume</span><kbd
										class="bg-muted px-2 py-0.5 rounded text-xs">Space</kbd
									>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-muted-foreground">Cancel Recording</span><kbd
										class="bg-muted px-2 py-0.5 rounded text-xs">Esc</kbd
									>
								</div>
							</div>
						</div>
						<div class="space-y-2">
							<h4 class="font-semibold">Webcam Controls (during recording)</h4>
							<div class="space-y-1.5">
								<div class="flex justify-between items-center">
									<span class="text-muted-foreground">Move Webcam</span><kbd
										class="bg-muted px-2 py-0.5 rounded text-xs">↑↓←→</kbd
									>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-muted-foreground">Increase Size</span><kbd
										class="bg-muted px-2 py-0.5 rounded text-xs">+</kbd
									>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-muted-foreground">Decrease Size</span><kbd
										class="bg-muted px-2 py-0.5 rounded text-xs">-</kbd
									>
								</div>
								<div class="flex justify-between items-center">
									<span class="text-muted-foreground">Toggle Shape</span><kbd
										class="bg-muted px-2 py-0.5 rounded text-xs">C</kbd
									>
								</div>
							</div>
						</div>
					</div>
					<p class="mt-3 text-xs text-muted-foreground">
						Tip: Click the keyboard icon next to "Start Recording" to see available shortcuts.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="smart-recording">
				<AccordionTrigger>How does the smart recording workflow work?</AccordionTrigger>
				<AccordionContent>
					<p class="text-sm mb-2">
						Our smart recording feature creates a seamless review experience:
					</p>
					<ol class="list-decimal list-inside space-y-2 text-sm">
						<li>Click <strong>Start Recording</strong> on the Video tab</li>
						<li>You're automatically taken to the <strong>Code Editor</strong> to review code</li>
						<li>A floating recording indicator shows time and controls</li>
						<li>Scroll through code while explaining - we capture everything</li>
						<li>
							Click <strong>Stop</strong> when done (or press
							<kbd class="bg-muted px-1 rounded text-xs">S</kbd>)
						</li>
						<li>You're automatically returned to save your video</li>
					</ol>
					<p class="mt-2 text-xs text-muted-foreground">
						The floating indicator lets you pause/stop recording from any step!
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="editing-reviews">
				<AccordionTrigger>Can I edit a review after creating it?</AccordionTrigger>
				<AccordionContent>
					<p class="text-sm mb-2">Yes! You can edit reviews from the review details page:</p>
					<ul class="list-disc list-inside space-y-1 text-sm">
						<li><strong>Title & Description:</strong> Click the edit button to modify</li>
						<li><strong>Publish Drafts:</strong> Click "Publish" to make a draft public</li>
						<li><strong>Replace Video:</strong> Re-record or upload a new video</li>
						<li><strong>AI Analysis:</strong> Re-run analysis anytime</li>
					</ul>
					<p class="mt-2 text-xs text-muted-foreground">
						Note: Code content is preserved from the original import.
					</p>
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
			<Button
				variant="outline"
				href="https://github.com/mudiageo/codereview-live/issues"
				target="_blank"
			>
				Report Bug
			</Button>
		</div>
	</section>
</div>
