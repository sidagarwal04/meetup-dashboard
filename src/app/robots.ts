export const runtime = 'edge';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
  };
}
