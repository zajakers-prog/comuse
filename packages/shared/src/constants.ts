export const CATEGORIES = [
  { value: 'writing', label: 'Writing', icon: 'pen-tool' },
  { value: 'music', label: 'Music', icon: 'music' },
  { value: 'comic', label: 'Comic', icon: 'image' },
  { value: 'screenplay', label: 'Screenplay', icon: 'film' },
  { value: 'lyrics', label: 'Lyrics', icon: 'mic' },
] as const;

export const LANGUAGES = [
  { value: 'ko', label: 'Korean' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
] as const;

export const LICENSE_TYPES = [
  { value: 'open', label: 'Open', description: 'Anyone can branch freely' },
  { value: 'approval', label: 'Approval', description: 'Branching requires creator approval' },
] as const;
