// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
      session: import('better-auth').Session | null;
      user: import('better-auth').User | null;
      auth: () => Promise<import('better-auth').Session | null>;
    }
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
