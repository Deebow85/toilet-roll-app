import * as Sentry from '@sentry/react';

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', /^https:\/\/yourwebsite\.com/],
        }),
        new Sentry.Replay(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context
    });
  } else {
    console.error('Error:', error, 'Context:', context);
  }
}

export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email
  });
}

export function addBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level
  });
}