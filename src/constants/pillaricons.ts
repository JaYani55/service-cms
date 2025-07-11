export const Product_ICONS = [
  { name: 'balloon', label: 'Balloon', path: '/assets/pillar-icons/Balloon--Streamline-Core-Remix.svg' },
  { name: 'camping-tent', label: 'Camping Tent', path: '/assets/pillar-icons/Camping-Tent--Streamline-Core-Remix.svg' },
  { name: 'cat', label: 'Cat', path: '/assets/pillar-icons/Cat-1--Streamline-Core-Remix.svg' },
  { name: 'chat-bubble-1', label: 'Chat Bubble 1', path: '/assets/pillar-icons/Chat-Bubble-Oval-Smiley-1--Streamline-Core-Remix.svg' },
  { name: 'chat-bubble-2', label: 'Chat Bubble 2', path: '/assets/pillar-icons/Chat-Bubble-Oval-Smiley-2--Streamline-Core-Remix.svg' },
  { name: 'chess-knight', label: 'Chess Knight', path: '/assets/pillar-icons/Chess-Knight--Streamline-Core-Remix.svg' },
  { name: 'cloud-refresh', label: 'Cloud Refresh', path: '/assets/pillar-icons/Cloud-Refresh--Streamline-Core-Remix.svg' },
  { name: 'coffee-cup', label: 'Coffee Cup', path: '/assets/pillar-icons/Coffee-Takeaway-Cup--Streamline-Core-Remix.svg' },
  { name: 'cog', label: 'Cog', path: '/assets/pillar-icons/Cog-1--Streamline-Core-Remix.svg' },
  { name: 'crown', label: 'Crown', path: '/assets/pillar-icons/Crown--Streamline-Core-Remix.svg' },
  { name: 'definition-book', label: 'Definition Book', path: '/assets/pillar-icons/Definition-Search-Book--Streamline-Core-Remix.svg' },
  { name: 'desktop-emoji', label: 'Desktop Emoji', path: '/assets/pillar-icons/Desktop-Emoji--Streamline-Core-Remix.svg' },
  { name: 'diamond', label: 'Diamond', path: '/assets/pillar-icons/Diamond-2--Streamline-Core-Remix.svg' },
  { name: 'dices', label: 'Dices', path: '/assets/pillar-icons/Dices-Entertainment-Gaming-Dices--Streamline-Core-Remix.svg' },
  { name: 'ear', label: 'Ear', path: '/assets/pillar-icons/Ear-Hearing--Streamline-Core-Remix.svg' },
  { name: 'earth', label: 'Earth', path: '/assets/pillar-icons/Earth-1--Streamline-Core-Remix.svg' },
  { name: 'clipboard', label: 'Clipboard', path: '/assets/pillar-icons/Empty-Clipboard--Streamline-Core-Remix.svg' },
  { name: 'flower', label: 'Flower', path: '/assets/pillar-icons/Flower--Streamline-Core-Remix.svg' },
  { name: 'front-camera', label: 'Front Camera', path: '/assets/pillar-icons/Front-Camera--Streamline-Core-Remix.svg' },
  { name: 'graduation-cap', label: 'Graduation Cap', path: '/assets/pillar-icons/Graduation-Cap--Streamline-Core-Remix.svg' },
  { name: 'heart', label: 'Heart', path: '/assets/pillar-icons/Heart--Streamline-Core-Remix.svg' },
  { name: 'key', label: 'Key', path: '/assets/pillar-icons/Key--Streamline-Core-Remix.svg' },
  { name: 'lightbulb', label: 'Lightbulb', path: '/assets/pillar-icons/Lightbulb--Streamline-Core-Remix.svg' },
  { name: 'module-puzzle-1', label: 'Module Puzzle 1', path: '/assets/pillar-icons/Module-Puzzle-1--Streamline-Core-Remix.svg' },
  { name: 'module-puzzle-3', label: 'Module Puzzle 3', path: '/assets/pillar-icons/Module-Puzzle-3--Streamline-Core-Remix.svg' },
  { name: 'mouse', label: 'Mouse', path: '/assets/pillar-icons/Mouse--Streamline-Core-Remix.svg' },
  { name: 'open-book', label: 'Open Book', path: '/assets/pillar-icons/Open-Book--Streamline-Core-Remix.svg' },
  { name: 'open-umbrella', label: 'Open Umbrella', path: '/assets/pillar-icons/Open-Umbrella--Streamline-Core-Remix.svg' },
  { name: 'paint-palette', label: 'Paint Palette', path: '/assets/pillar-icons/Paint-Palette--Streamline-Core-Remix.svg' },
  { name: 'paintbrush', label: 'Paintbrush', path: '/assets/pillar-icons/Paintbrush-2--Streamline-Core-Remix.svg' },
  { name: 'piggy-bank', label: 'Piggy Bank', path: '/assets/pillar-icons/Piggy-Bank--Streamline-Core-Remix.svg' },
  { name: 'popcorn', label: 'Popcorn', path: '/assets/pillar-icons/Popcorn--Streamline-Core-Remix.svg' },
  { name: 'pork-meat', label: 'piggy', path: '/assets/pillar-icons/Pork-Meat--Streamline-Core-Remix.svg' },
  { name: 'sail-ship', label: 'Sail Ship', path: '/assets/pillar-icons/Sail-Ship--Streamline-Core-Remix.svg' },
  { name: 'screensaver', label: 'Screensaver', path: '/assets/pillar-icons/Screensaver-Monitor-Wallpaper--Streamline-Core-Remix.svg' },
  { name: 'sprout', label: 'Sprout', path: '/assets/pillar-icons/Sprout--Streamline-Core-Remix.svg' },
  { name: 'star', label: 'Star', path: '/assets/pillar-icons/Star-1--Streamline-Core-Remix.svg' },
  { name: 'startup', label: 'Startup', path: '/assets/pillar-icons/Startup--Streamline-Core-Remix.svg' },
  { name: 'strawberry', label: 'Strawberry', path: '/assets/pillar-icons/Strawberry--Streamline-Core-Remix.svg' },
  { name: 'tea-cup', label: 'Tea Cup', path: '/assets/pillar-icons/Tea-Cup--Streamline-Core-Remix.svg' },
  { name: 'tree', label: 'Tree', path: '/assets/pillar-icons/Tree-3--Streamline-Core-Remix.svg' },
  { name: 'webcam', label: 'Webcam', path: '/assets/pillar-icons/Webcam-Video-Circle--Streamline-Core-Remix.svg' },
];
export const getIconByName = (iconName: string | undefined, isDark: boolean = false): string => {
  if (!iconName) return '/assets/pillar-icons/Balloon--Streamline-Core-Remix.svg';
  
  // Find the icon in the Product_ICONS array
  const icon = Product_ICONS.find(icon => icon.name === iconName);
  
  // Return the path or a default if not found
  return icon ? icon.path : '/assets/pillar-icons/Balloon--Streamline-Core-Remix.svg';
  
  // Note: This implementation ignores the isDark parameter since your
  // current setup doesn't seem to have separate dark/light icons
  // If you need dark mode icons in the future, you'll need to add them
}