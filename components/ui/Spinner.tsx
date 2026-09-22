import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 24 }: { size?: number }) {
  return <Loader2 className="animate-spin text-primary" style={{ width: size, height: size }} />;
}
