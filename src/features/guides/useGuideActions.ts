import { useNavigate } from 'react-router-dom';
import { useGuide } from '../../context/GuideContext';
import { GuideStepAction, GuideAction } from '../../types/guide';

export function useGuideActions() {
  const navigate = useNavigate();
  const { setReturnGuideId, activeGuideId } = useGuide();

  const executeAction = (action: GuideStepAction | GuideAction) => {
    // Store return context so user can come back to the guide
    if (activeGuideId) {
      setReturnGuideId(activeGuideId);
    }
    
    const actionType = action.type || 'navigate';
    const targetPath = 'targetPath' in action ? action.targetPath : undefined;
    
    switch (actionType) {
      case 'navigate':
        if (targetPath) navigate(targetPath);
        break;
      case 'open-focus':
        navigate(targetPath || '/app/focus');
        break;
      case 'open-study':
        navigate(targetPath || '/app/study');
        break;
      case 'open-task-creator':
        navigate(targetPath || '/app/tasks?action=new');
        break;
      case 'open-note-creator':
        navigate(targetPath || '/app/notes?action=new');
        break;
      case 'open-modal':
        // For modal actions, we'd need a different mechanism
        if (targetPath) navigate(targetPath);
        break;
      default:
        if (targetPath) navigate(targetPath);
    }
  };

  return { executeAction };
}
