import { NotificationProvider } from '@/components/coding-admin/Notifications';
import ExerciseManager from '@/components/coding-admin/ExerciseManager';

export default function CodingAdminPage() {
  return (
    <NotificationProvider>
      <div className="p-6">
        <ExerciseManager />
      </div>
    </NotificationProvider>
  );
}