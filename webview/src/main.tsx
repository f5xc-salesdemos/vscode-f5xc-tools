// webview/src/main.tsx
// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import ReactDOM from 'react-dom/client';
import { SessionView } from './components/SessionView';
import { initProtocol, on } from './lib/protocol';
import { createNewSession, getActiveSession } from './state/sessions';
import './styles/webview.css';

interface WelcomeState {
  version?: string;
  model?: string;
  modelProvider?: string;
  integrations?: Array<{ name: string; connected: boolean }>;
}

// Welcome state store
export let welcomeState: WelcomeState = {};

const welcomeListeners = new Set<() => void>();

export function subscribeWelcome(fn: () => void): () => void {
  welcomeListeners.add(fn);
  return () => welcomeListeners.delete(fn);
}

export function getWelcomeState() {
  return welcomeState;
}

// Initialize protocol and session
initProtocol();
createNewSession();

// Wire protocol events to active session
on('message_update', (msg) => {
  const session = getActiveSession();
  if (session) {
    session.appendAssistantText(msg.text as string);
  }
});

on('tool_execution_start', (msg) => {
  const session = getActiveSession();
  if (session) {
    session.addToolStart(msg.toolName as string, msg.toolCallId as string);
  }
});

on('tool_execution_end', (msg) => {
  const session = getActiveSession();
  if (session) {
    session.endToolUse(msg.toolCallId as string);
  }
});

on('turn_end', () => {
  const session = getActiveSession();
  if (session) {
    session.endTurn();
  }
});

on('welcome_state', (msg) => {
  welcomeState = msg as WelcomeState;
  for (const fn of welcomeListeners) {
    fn();
  }
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<SessionView />);
}
