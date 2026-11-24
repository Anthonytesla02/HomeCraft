import {
  Aperture,
  Calculator,
  Calendar,
  Camera,
  Car,
  CheckSquare,
  CreditCard,
  Crown,
  FileText,
  FolderOpen,
  Gamepad2,
  Globe,
  HardDrive,
  Hash,
  Image as ImageIcon,
  Landmark,
  Mail,
  MessageCircle,
  MessageSquare,
  Music,
  Navigation,
  Phone,
  Play,
  Settings,
  Shield,
  Train,
  Tv,
  Wallet,
} from 'lucide-react';
import type { IconShape } from '../core/types';

interface AppIconGlyphProps {
  iconKey: string;
  color: string;
  name: string;
  shape: IconShape;
  size?: 'sm' | 'md' | 'lg';
}

const SHAPE_RADIUS: Record<IconShape, string> = {
  squircle: 'rounded-[28%]',
  circle: 'rounded-full',
  rounded: 'rounded-xl',
};

const SIZE_CLASSES = {
  sm: { box: 'w-7 h-7', icon: 14 },
  md: { box: 'w-11 h-11', icon: 20 },
  lg: { box: 'w-12 h-12', icon: 22 },
};

export function AppIconGlyph({
  iconKey,
  color,
  name,
  shape,
  size = 'md',
}: AppIconGlyphProps) {
  const { box, icon } = SIZE_CLASSES[size];

  const renderGlyph = () => {
    const props = { size: icon, strokeWidth: 2, className: 'text-white' };
    switch (iconKey) {
      case 'message':
        return <MessageSquare {...props} />;
      case 'phone':
        return <Phone {...props} />;
      case 'camera':
        return <Camera {...props} />;
      case 'globe':
        return <Globe {...props} />;
      case 'mail':
        return <Mail {...props} />;
      case 'music':
        return <Music {...props} />;
      case 'map':
        return <Navigation {...props} />;
      case 'hash':
        return <Hash {...props} />;
      case 'calendar':
        return <Calendar {...props} />;
      case 'file-text':
        return <FileText {...props} />;
      case 'play':
        return <Play {...props} />;
      case 'landmark':
        return <Landmark {...props} />;
      case 'check-square':
        return <CheckSquare {...props} />;
      case 'image':
        return <ImageIcon {...props} />;
      case 'aperture':
        return <Aperture {...props} />;
      case 'car':
        return <Car {...props} />;
      case 'credit-card':
        return <CreditCard {...props} />;
      case 'shield':
        return <Shield {...props} />;
      case 'hard-drive':
        return <HardDrive {...props} />;
      case 'settings':
        return <Settings {...props} />;
      case 'message-circle':
        return <MessageCircle {...props} />;
      case 'tv':
        return <Tv {...props} />;
      case 'wallet':
        return <Wallet {...props} />;
      case 'calculator':
        return <Calculator {...props} />;
      case 'train':
        return <Train {...props} />;
      case 'crown':
        return <Crown {...props} />;
      case 'gamepad':
        return <Gamepad2 {...props} />;
      case 'folder-open':
        return <FolderOpen {...props} />;
      default:
        return (
          <span className="text-xs font-semibold text-white">
            {name.slice(0, 1).toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div
      className={`${box} ${SHAPE_RADIUS[shape]} flex items-center justify-center shrink-0 shadow-xs`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {renderGlyph()}
    </div>
  );
}
