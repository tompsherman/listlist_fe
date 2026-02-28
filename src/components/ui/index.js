/**
 * UI Component Library
 * Export all components from a single entry point
 */

// Core
export { default as Button } from './Button';
export { Card, CardHeader, CardBody, CardFooter } from './Card';
export { default as CollapsibleCard } from './CollapsibleCard';
export { default as Badge } from './Badge';
export { default as Avatar } from './Avatar';

// Feedback
export { ToastProvider, useToast } from './Toast';
export { default as Modal, ModalFooter } from './Modal';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as Tooltip } from './Tooltip';
export { default as TypingIndicator } from './TypingIndicator';

// Loading & States
export { default as Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard } from './Skeleton';
export { default as EmptyState } from './EmptyState';
export { default as ErrorState } from './ErrorState';

// Input
export { default as Toggle } from './Toggle';
export { default as SearchBar } from './SearchBar';
export { default as CountUpDown } from './CountUpDown';
export { default as DatePicker } from './DatePicker';
export { default as CharacterCounter } from './CharacterCounter';
export { default as StarRating } from './StarRating';
export { default as SlidingScale, getScaleColor, getScaleLabel } from './SlidingScale';

// Progress & Time
export { default as ProgressBar } from './ProgressBar';
export { default as Timer } from './Timer';
export { default as Pagination } from './Pagination';

// Layout
export { default as Hero } from './Hero';
export { Accordion, AccordionItem } from './Accordion';

// Milestone 3: Small UI Components
export { default as BackToTop } from './BackToTop';
export { default as CopyButton } from './CopyButton';
export { default as InfiniteScroll } from './InfiniteScroll';
export { default as Kbd } from './Kbd';
export { default as LazyImage } from './LazyImage';
export { default as NotificationBadge } from './NotificationBadge';
export { default as OfflineBanner } from './OfflineBanner';
export { default as ReadMore } from './ReadMore';

// Milestone 4: Blog Composer
export { default as BlogComposer } from './BlogComposer';

// Milestone 5: Medium UI Components
export { Tabs, TabList, Tab, TabPanel } from './Tabs';
export { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
export { default as TagInput } from './TagInput';
export { default as RelativeTime } from './RelativeTime';
export { default as CurrencyInput } from './CurrencyInput';
export { default as ImageWithFallback } from './ImageWithFallback';

// Milestone 6: Wizard
export { Wizard, WizardStep, WizardStepIndicator, useWizard } from './Wizard';

// Milestone 7 & 8: Drag & Drop
export { default as SortableList, arrayMove } from './SortableList';
export { default as Kanban } from './Kanban';
export { default as ReorderableGrid } from './ReorderableGrid';
export { default as FileDropZone } from './FileDropZone';

// Milestone 9: File Upload - REMOVED (depends on Skeleton Key services)
// export { default as FileUpload } from './FileUpload';

// Milestone 10: Comment Section - REMOVED (depends on Skeleton Key AuthContext)
// export { default as CommentSection } from './CommentSection';

// Milestone 11: Data Visualization
export { LineChart, BarChart, DonutChart } from './charts';
