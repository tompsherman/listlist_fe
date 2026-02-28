/**
 * Dev Route - Component Showcase
 * Internal Storybook alternative
 */

import { useState, useEffect, useRef } from 'react';
import SEO from '../components/SEO';
import {
  useMath,
  useTimer,
  formatTime,
  useToggle,
  useLocalStorage,
  useMediaQuery,
  useDebounce,
  usePrevious,
  // Milestone 1 hooks
  useCopyToClipboard,
  useIntersectionObserver,
  useInterval,
  useKeyPress,
  useNetworkStatus,
  useOnClickOutside,
  useScrollPosition,
  scrollToTop,
  useWindowSize,
  // Milestone 2
  useUndoRedo,
} from '../hooks';
import {
  Button,
  Card, CardHeader, CardBody, CardFooter,
  CollapsibleCard,
  Badge,
  Avatar,
  Modal, ModalFooter,
  ConfirmDialog,
  Tooltip,
  TypingIndicator,
  Skeleton, SkeletonText, SkeletonCard,
  EmptyState,
  ErrorState,
  Toggle,
  SearchBar,
  CountUpDown,
  DatePicker,
  Hero,
  Accordion, AccordionItem,
  useToast,
  // New components
  CharacterCounter,
  StarRating,
  SlidingScale,
  ProgressBar,
  Timer,
  Pagination,
  // Milestone 3 components
  BackToTop,
  CopyButton,
  InfiniteScroll,
  Kbd,
  LazyImage,
  NotificationBadge,
  OfflineBanner,
  ReadMore,
  // Milestone 4
  BlogComposer,
  // Milestone 5
  Tabs, TabList, Tab, TabPanel,
  Breadcrumb, BreadcrumbItem,
  TagInput,
  RelativeTime,
  CurrencyInput,
  ImageWithFallback,
  // Milestone 6
  Wizard, WizardStep, WizardStepIndicator,
  // Milestone 7 & 8
  SortableList,
  Kanban,
  ReorderableGrid,
  FileDropZone,
  // Milestone 9
  // FileUpload, // REMOVED
  // Milestone 10
  // CommentSection, // REMOVED
  // Milestone 11
  LineChart,
  BarChart,
  DonutChart,
} from '../components/ui';

export default function Dev() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleValue, setToggleValue] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [countValue, setCountValue] = useState(5);
  const [dateValue, setDateValue] = useState('');
  // New component state
  const [charCountValue, setCharCountValue] = useState('');
  const [starValue, setStarValue] = useState(3);
  const [scaleValue, setScaleValue] = useState(5);
  const [progressValue, setProgressValue] = useState(65);
  const [currentPage, setCurrentPage] = useState(1);
  // Milestone 5 state
  const [activeTab, setActiveTab] = useState('tab1');
  const [tags, setTags] = useState(['React', 'TypeScript']);
  const [currencyValue, setCurrencyValue] = useState(9999); // $99.99 in cents
  // Milestone 7 state - Sortable blocks
  const INITIAL_BLOCKS = [
    { id: '1', label: 'Block 1', color: '#4A90D9' },
    { id: '2', label: 'Block 2', color: '#5BAD6F' },
    { id: '3', label: 'Block 3', color: '#E8834A' },
    { id: '4', label: 'Block 4', color: '#9B6BB5' },
    { id: '5', label: 'Block 5', color: '#DAA520' },
  ];
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [savedBlockOrder, setSavedBlockOrder] = useState(INITIAL_BLOCKS.map(b => b.id));
  // Milestone 8 state
  const [kanbanColumns, setKanbanColumns] = useState([
    { id: 'todo', title: 'To Do', items: [{ id: 'task-1', title: 'Design mockups' }, { id: 'task-2', title: 'Write specs' }] },
    { id: 'progress', title: 'In Progress', items: [{ id: 'task-3', title: 'Build components' }] },
    { id: 'done', title: 'Done', items: [{ id: 'task-4', title: 'Setup project' }] },
  ]);
  const [gridItems, setGridItems] = useState([
    { id: 'g1', color: '#FF6B6B' }, { id: 'g2', color: '#4ECDC4' }, { id: 'g3', color: '#45B7D1' },
    { id: 'g4', color: '#96CEB4' }, { id: 'g5', color: '#FFEAA7' }, { id: 'g6', color: '#DDA0DD' },
  ]);

  return (
    <>
      <SEO
        title="Dev - Component Library"
        description="Internal component showcase for Skeleton Key UI library."
        path="/dev"
        noIndex
      />

      {/* Global components */}
      <BackToTop threshold={300} />
      <OfflineBanner />

      <div className="container">
        <h1 style={{ marginBottom: 'var(--space-8)' }}>🧩 Component Library</h1>

        {/* Buttons */}
        <Section title="Button">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Variants: primary, secondary, ghost, destructive
          </p>
          <Row>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </Row>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Sizes: sm, md, lg
          </p>
          <Row>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </Row>
        </Section>

        {/* Card */}
        <Section title="Card">
          <Row gap="var(--space-4)">
            <Card style={{ width: 280 }}>
              <CardHeader>Card Title</CardHeader>
              <CardBody>Card content goes here.</CardBody>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
            <Card hoverable style={{ width: 280 }}>
              <CardBody>Hoverable card</CardBody>
            </Card>
          </Row>
        </Section>

        {/* CollapsibleCard */}
        <Section title="CollapsibleCard">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Card with clickable header that toggles body visibility.
          </p>
          <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <CollapsibleCard title="Click to expand" defaultOpen>
              This content is visible by default because <code>defaultOpen</code> is set.
            </CollapsibleCard>
            <CollapsibleCard title="Another section" icon="📦">
              This one starts collapsed and has an icon.
            </CollapsibleCard>
            <CollapsibleCard title="FAQ: How does it work?" icon="❓">
              The header is a button that toggles the body visibility. 
              Uses card styling with smooth animation.
            </CollapsibleCard>
          </div>
        </Section>

        {/* Badge */}
        <Section title="Badge">
          <Row>
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </Row>
          <Row>
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
          </Row>
        </Section>

        {/* Avatar */}
        <Section title="Avatar">
          <Row>
            <Avatar name="John Doe" size="sm" />
            <Avatar name="Jane Smith" size="md" />
            <Avatar name="Bob" size="lg" />
            <Avatar src="https://i.pravatar.cc/150?u=a" name="With Image" size="lg" />
          </Row>
          <Row>
            <Avatar name="Online" status="online" />
            <Avatar name="Offline" status="offline" />
            <Avatar name="Busy" status="busy" />
            <Avatar name="Away" status="away" />
          </Row>
        </Section>

        {/* Toast */}
        <Section title="Toast">
          <Row>
            <Button onClick={() => toast.success('Operation completed successfully')}>Success</Button>
            <Button onClick={() => toast.error('Something went wrong')}>Error</Button>
            <Button onClick={() => toast.warning('This action cannot be undone')}>Warning</Button>
            <Button onClick={() => toast.info('Here is some information')}>Info</Button>
          </Row>
        </Section>

        {/* Modal */}
        <Section title="Modal">
          <Row>
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
            <Button onClick={() => setConfirmOpen(true)}>Open Confirm Dialog</Button>
          </Row>
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Example Modal">
            <p>This is modal content. It has focus trap and can be closed with Escape.</p>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={() => setModalOpen(false)}>Save</Button>
            </ModalFooter>
          </Modal>
          <ConfirmDialog
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => { toast.success('Confirmed!'); setConfirmOpen(false); }}
            title="Confirm Action"
            message="Are you sure you want to proceed?"
            variant="destructive"
          />
        </Section>

        {/* Tooltip */}
        <Section title="Tooltip">
          <Row>
            <Tooltip content="Top tooltip" position="top">
              <Button variant="secondary">Top</Button>
            </Tooltip>
            <Tooltip content="Bottom tooltip" position="bottom">
              <Button variant="secondary">Bottom</Button>
            </Tooltip>
            <Tooltip content="Left tooltip" position="left">
              <Button variant="secondary">Left</Button>
            </Tooltip>
            <Tooltip content="Right tooltip" position="right">
              <Button variant="secondary">Right</Button>
            </Tooltip>
          </Row>
        </Section>

        {/* Skeleton */}
        <Section title="Skeleton">
          <Row gap="var(--space-4)">
            <div style={{ width: 200 }}>
              <Skeleton variant="text" width="60%" />
              <div style={{ marginTop: 'var(--space-2)' }}>
                <SkeletonText lines={3} />
              </div>
            </div>
            <SkeletonCard style={{ width: 200 }} />
          </Row>
        </Section>

        {/* TypingIndicator */}
        <Section title="TypingIndicator">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Three bouncing dots animation. Great for chat "typing" states or thinking indicators.
          </p>
          <Row>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Sizes:</span>
            <TypingIndicator size="sm" />
            <TypingIndicator size="md" />
            <TypingIndicator size="lg" />
          </Row>
          <Row style={{ marginTop: 'var(--space-3)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>With label:</span>
            <TypingIndicator showLabel />
            <TypingIndicator showLabel label="Thinking" />
          </Row>
          <Row style={{ marginTop: 'var(--space-3)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Custom colors:</span>
            <TypingIndicator color="var(--color-primary)" />
            <TypingIndicator color="var(--color-success)" />
            <TypingIndicator color="var(--color-warning)" />
          </Row>
          <div style={{ 
            marginTop: 'var(--space-4)', 
            padding: 'var(--space-3)', 
            background: 'var(--color-bg-secondary)', 
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span style={{ fontSize: 'var(--text-sm)' }}>AI is thinking</span>
            <TypingIndicator size="sm" />
          </div>
        </Section>

        {/* Empty & Error States */}
        <Section title="Empty & Error States">
          <Row gap="var(--space-8)">
            <div style={{ flex: 1 }}>
              <EmptyState
                icon="📭"
                title="No items yet"
                description="Get started by adding your first item."
                action={() => toast.info('Add item clicked')}
                actionLabel="Add Item"
              />
            </div>
            <div style={{ flex: 1 }}>
              <ErrorState
                title="Failed to load"
                description="There was a problem loading your data."
                onRetry={() => toast.info('Retry clicked')}
              />
            </div>
          </Row>
        </Section>

        {/* Toggle */}
        <Section title="Toggle">
          <Row>
            <Toggle checked={toggleValue} onChange={setToggleValue} label="Enable feature" />
          </Row>
          <Row>
            <Toggle checked={true} onChange={() => {}} size="sm" label="Small" />
            <Toggle checked={true} onChange={() => {}} size="md" label="Medium" />
            <Toggle checked={true} onChange={() => {}} size="lg" label="Large" />
          </Row>
        </Section>

        {/* SearchBar */}
        <Section title="SearchBar">
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search items..."
          />
          <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Value: "{searchValue}" (debounced 300ms)
          </p>
        </Section>

        {/* CountUpDown */}
        <Section title="CountUpDown">
          <Row>
            <CountUpDown value={countValue} onChange={setCountValue} min={0} max={10} size="sm" />
            <CountUpDown value={countValue} onChange={setCountValue} min={0} max={10} size="md" />
            <CountUpDown value={countValue} onChange={setCountValue} min={0} max={10} size="lg" />
          </Row>
          <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Value: {countValue} (min: 0, max: 10)
          </p>
        </Section>

        {/* DatePicker */}
        <Section title="DatePicker">
          <DatePicker value={dateValue} onChange={setDateValue} />
          <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            ISO Value: "{dateValue || '(empty)'}"
          </p>
        </Section>

        {/* Hero */}
        <Section title="Hero">
          <div style={{ border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <Hero
              title="Welcome to Skeleton Key"
              subtitle="Production-ready starter kit for your next project."
              primaryAction={() => toast.success('Primary clicked')}
              primaryLabel="Get Started"
              secondaryAction={() => toast.info('Secondary clicked')}
              secondaryLabel="Learn More"
            />
          </div>
        </Section>

        {/* Accordion */}
        <Section title="Accordion">
          <Accordion>
            <AccordionItem id="1" title="What is Skeleton Key?">
              Skeleton Key is a production-ready full-stack starter kit with React, Express, MongoDB, and Auth0.
            </AccordionItem>
            <AccordionItem id="2" title="How do I get started?">
              Clone the repo, copy .env.example to .env, fill in your values, and run npm run dev.
            </AccordionItem>
            <AccordionItem id="3" title="Is it free to use?">
              Yes! Skeleton Key is open source and free to use for any project.
            </AccordionItem>
          </Accordion>
        </Section>

        {/* CharacterCounter */}
        <Section title="CharacterCounter">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Textarea with live character count. Warning at 80%, error at limit.
          </p>
          <div style={{ maxWidth: 400 }}>
            <CharacterCounter
              value={charCountValue}
              onChange={setCharCountValue}
              maxLength={140}
              placeholder="Write something..."
            />
          </div>
        </Section>

        {/* StarRating */}
        <Section title="StarRating">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Interactive rating with hover preview. Click same star to clear.
          </p>
          <Row>
            <StarRating value={starValue} onChange={setStarValue} size="sm" />
            <StarRating value={starValue} onChange={setStarValue} size="md" showValue />
            <StarRating value={starValue} onChange={setStarValue} size="lg" />
          </Row>
          <Row>
            <StarRating value={4} readOnly size="md" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Read-only</span>
          </Row>
        </Section>

        {/* SlidingScale */}
        <Section title="SlidingScale">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Sentiment bar: red (1-3), yellow (4-7), green (8-10).
          </p>
          <div style={{ maxWidth: 400 }}>
            <SlidingScale
              value={scaleValue}
              onChange={setScaleValue}
              showValue
              showLabel
            />
          </div>
        </Section>

        {/* ProgressBar */}
        <Section title="ProgressBar">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Simple progress indicator with color variants.
          </p>
          <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <ProgressBar value={progressValue} showLabel />
            <ProgressBar value={75} color="success" size="sm" />
            <ProgressBar value={40} color="warning" size="lg" animated />
            <ProgressBar value={90} color="error" showLabel labelPosition="left" />
          </div>
          <Row style={{ marginTop: 'var(--space-4)' }}>
            <Button size="sm" onClick={() => setProgressValue(Math.max(0, progressValue - 10))}>-10%</Button>
            <Button size="sm" onClick={() => setProgressValue(Math.min(100, progressValue + 10))}>+10%</Button>
          </Row>
        </Section>

        {/* Timer */}
        <Section title="Timer">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Countdown and stopwatch powered by useTimer hook.
          </p>
          <Row gap="var(--space-8)">
            <div>
              <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>Countdown (30s)</p>
              <Timer
                duration={30}
                countdown={true}
                onComplete={() => toast.success('Time up!')}
                size="md"
              />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>Stopwatch</p>
              <Timer
                countdown={false}
                size="md"
              />
            </div>
          </Row>
        </Section>

        {/* Pagination */}
        <Section title="Pagination">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Page navigation with optional jump-to.
          </p>
          <Pagination
            page={currentPage}
            totalPages={10}
            onPageChange={setCurrentPage}
            showJumpTo
          />
        </Section>

        <h1 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>🧩 Milestone 3 Components</h1>

        {/* NotificationBadge */}
        <Section title="NotificationBadge">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Overlays a count or dot on any element.
          </p>
          <Row>
            <NotificationBadge count={5}>
              <Button variant="secondary">🔔 Notifications</Button>
            </NotificationBadge>
            <NotificationBadge count={99}>
              <Button variant="secondary">📬 Messages</Button>
            </NotificationBadge>
            <NotificationBadge count={150} max={99}>
              <Button variant="secondary">📧 Inbox</Button>
            </NotificationBadge>
            <NotificationBadge dot color="success">
              <Button variant="secondary">🟢 Status</Button>
            </NotificationBadge>
          </Row>
        </Section>

        {/* CopyButton */}
        <Section title="CopyButton">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Copy any text with a single click. Shows checkmark after copying.
          </p>
          <Row>
            <code style={{
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'monospace',
            }}>
              npm install skeleton-key
            </code>
            <CopyButton text="npm install skeleton-key" />
            <CopyButton text="npm install skeleton-key" showLabel />
          </Row>
        </Section>

        {/* Kbd */}
        <Section title="Kbd">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Styled keyboard keys for shortcuts and documentation.
          </p>
          <Row>
            <span>Save: <Kbd keys={['cmd', 'S']} /></span>
            <span>Undo: <Kbd keys={['ctrl', 'Z']} /></span>
            <span>Search: <Kbd keys={['cmd', 'K']} /></span>
          </Row>
          <Row>
            <Kbd>Enter</Kbd>
            <Kbd>Esc</Kbd>
            <Kbd>Tab</Kbd>
            <Kbd>Backspace</Kbd>
            <Kbd>Up</Kbd>
            <Kbd>Down</Kbd>
          </Row>
        </Section>

        {/* ReadMore */}
        <Section title="ReadMore">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Truncate long text with expandable toggle.
          </p>
          <div style={{ maxWidth: 400 }}>
            <ReadMore lines={2}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </ReadMore>
          </div>
        </Section>

        {/* LazyImage */}
        <Section title="LazyImage">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Images load only when scrolled into view.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <LazyImage
              src="https://picsum.photos/200/150?random=1"
              alt="Random image 1"
              style={{ width: 200, height: 150, borderRadius: 'var(--radius-md)' }}
            />
            <LazyImage
              src="https://picsum.photos/200/150?random=2"
              alt="Random image 2"
              style={{ width: 200, height: 150, borderRadius: 'var(--radius-md)' }}
            />
          </div>
        </Section>

        {/* BackToTop - already shown in scroll demo */}
        <Section title="BackToTop">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Floating button appears after scrolling 300px. Scroll down to see it!
          </p>
          <Badge variant="info">👀 Check bottom-right corner after scrolling</Badge>
        </Section>

        {/* OfflineBanner */}
        <Section title="OfflineBanner">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Shows automatically when network disconnects. Try turning off WiFi!
          </p>
          <Badge variant="info">📡 Disconnect your network to see the banner</Badge>
        </Section>

        <h1 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>📝 Milestone 4: Blog Composer</h1>

        {/* BlogComposer */}
        <Section title="BlogComposer">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Markdown editor with live preview. Ctrl+Z/Y for undo/redo. Toggle between edit and preview modes.
          </p>
          <BlogComposer
            initialTitle=""
            initialContent=""
            onSave={(data) => toast.success(`Draft saved: "${data.title || 'Untitled'}" (${data.content.length} chars)`)}
            onPublish={(data) => toast.success(`Published: "${data.title}"`)}
          />
        </Section>

        <h1 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>🧩 Milestone 5: Medium Components</h1>

        {/* Tabs */}
        <Section title="Tabs">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Horizontal tabs with keyboard navigation (arrow keys, Home, End).
          </p>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab value="tab1">Overview</Tab>
              <Tab value="tab2">Features</Tab>
              <Tab value="tab3">Pricing</Tab>
              <Tab value="tab4" disabled>Coming Soon</Tab>
            </TabList>
            <TabPanel value="tab1">
              <Card><CardBody>This is the Overview tab content.</CardBody></Card>
            </TabPanel>
            <TabPanel value="tab2">
              <Card><CardBody>This is the Features tab content.</CardBody></Card>
            </TabPanel>
            <TabPanel value="tab3">
              <Card><CardBody>This is the Pricing tab content.</CardBody></Card>
            </TabPanel>
          </Tabs>
        </Section>

        {/* Breadcrumb */}
        <Section title="Breadcrumb">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Navigation hierarchy. Supports links, buttons, and current page indicator.
          </p>
          <Breadcrumb>
            <BreadcrumbItem href="#">Home</BreadcrumbItem>
            <BreadcrumbItem href="#">Products</BreadcrumbItem>
            <BreadcrumbItem href="#">Category</BreadcrumbItem>
            <BreadcrumbItem current>Current Page</BreadcrumbItem>
          </Breadcrumb>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Breadcrumb separator="›">
              <BreadcrumbItem onClick={() => toast.info('Home clicked')}>Home</BreadcrumbItem>
              <BreadcrumbItem onClick={() => toast.info('Settings clicked')}>Settings</BreadcrumbItem>
              <BreadcrumbItem current>Profile</BreadcrumbItem>
            </Breadcrumb>
          </div>
        </Section>

        {/* TagInput */}
        <Section title="TagInput">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Press Enter or comma to add tags. Backspace removes last. Paste comma-separated values.
          </p>
          <div style={{ maxWidth: 400 }}>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="Add skills..."
              maxTags={5}
            />
          </div>
          <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Tags: {JSON.stringify(tags)}
          </p>
        </Section>

        {/* RelativeTime */}
        <Section title="RelativeTime">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Auto-updating relative timestamps. Hover for absolute time.
          </p>
          <Row>
            <span>Just now: <RelativeTime date={new Date()} /></span>
          </Row>
          <Row>
            <span>5 minutes ago: <RelativeTime date={new Date(Date.now() - 5 * 60 * 1000)} /></span>
          </Row>
          <Row>
            <span>Yesterday: <RelativeTime date={new Date(Date.now() - 24 * 60 * 60 * 1000)} /></span>
          </Row>
          <Row>
            <span>Last week: <RelativeTime date={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)} /></span>
          </Row>
        </Section>

        {/* CurrencyInput */}
        <Section title="CurrencyInput">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Formats as currency. Stores value in cents internally.
          </p>
          <Row>
            <div style={{ width: 150 }}>
              <CurrencyInput
                value={currencyValue}
                onChange={setCurrencyValue}
              />
            </div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Raw: {currencyValue} cents
            </span>
          </Row>
        </Section>

        {/* ImageWithFallback */}
        <Section title="ImageWithFallback">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Shows placeholder when image fails to load.
          </p>
          <Row gap="var(--space-4)">
            <ImageWithFallback
              src="https://picsum.photos/100/100?random=fallback"
              alt="Working image"
              style={{ width: 100, height: 100, borderRadius: 'var(--radius-md)' }}
            />
            <ImageWithFallback
              src="https://invalid-url.test/broken.jpg"
              alt="Broken image"
              style={{ width: 100, height: 100, borderRadius: 'var(--radius-md)' }}
            />
          </Row>
        </Section>

        <h1 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>🧙 Milestone 6: Wizard</h1>

        {/* Wizard */}
        <Section title="Wizard / Multi-step Form">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Multi-step form with progress indicator. State accumulates across steps.
          </p>
          <Card>
            <CardBody>
              <Wizard
                onComplete={(data) => {
                  toast.success(`Form submitted: ${JSON.stringify(data)}`);
                }}
              >
                <WizardStep title="Step 1: Basic Info" description="Tell us about yourself">
                  {({ data, updateData, stepData }) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={stepData.name || ''}
                        onChange={(e) => updateData({ ...stepData, name: e.target.value })}
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg)',
                          color: 'var(--color-text)',
                        }}
                      />
                      <input
                        type="email"
                        placeholder="Your email"
                        value={stepData.email || ''}
                        onChange={(e) => updateData({ ...stepData, email: e.target.value })}
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-bg)',
                          color: 'var(--color-text)',
                        }}
                      />
                    </div>
                  )}
                </WizardStep>
                <WizardStep title="Step 2: Preferences" description="Customize your experience">
                  {({ updateData, stepData }) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <input
                          type="checkbox"
                          checked={stepData.newsletter || false}
                          onChange={(e) => updateData({ ...stepData, newsletter: e.target.checked })}
                        />
                        Subscribe to newsletter
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <input
                          type="checkbox"
                          checked={stepData.notifications || false}
                          onChange={(e) => updateData({ ...stepData, notifications: e.target.checked })}
                        />
                        Enable notifications
                      </label>
                    </div>
                  )}
                </WizardStep>
                <WizardStep title="Step 3: Confirm" description="Review and submit">
                  {({ data }) => (
                    <div style={{ background: 'var(--color-bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                      <p><strong>Ready to submit!</strong></p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                        Data collected: {JSON.stringify(data)}
                      </p>
                    </div>
                  )}
                </WizardStep>
              </Wizard>
            </CardBody>
          </Card>
        </Section>

        <h1 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>🎯 Milestone 7: Drag & Drop</h1>

        {/* SortableList */}
        <Section title="SortableList with 2.5D Effect">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Drag to reorder. "Save Order" appears only when order differs from saved state.
            Notice the lift effect when dragging!
          </p>
          <div style={{ marginBottom: 'var(--space-3)', fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Current order: [{blocks.map(b => b.id).join(', ')}]
          </div>
          <div style={{ maxWidth: 300 }}>
            <SortableList
              items={blocks}
              onChange={setBlocks}
              savedOrder={savedBlockOrder}
              onSave={(newOrder) => {
                setSavedBlockOrder(newOrder);
                toast.success('Order saved!');
              }}
              renderItem={({ id, isDragging }) => {
                const block = blocks.find(b => b.id === id);
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                  }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 'var(--radius-sm)',
                      background: block?.color,
                    }} />
                    <span style={{ fontWeight: 500 }}>{block?.label}</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.5 }}>⋮⋮</span>
                  </div>
                );
              }}
            />
          </div>
        </Section>

        <h1 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>🎯 Milestone 8: DnD Extensions</h1>

        {/* Kanban */}
        <Section title="Kanban Board">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Drag cards between columns. Great for project management.
          </p>
          <Kanban
            columns={kanbanColumns}
            onChange={setKanbanColumns}
            renderCard={(item) => (
              <div>
                <strong>{item.title}</strong>
              </div>
            )}
          />
        </Section>

        {/* ReorderableGrid */}
        <Section title="ReorderableGrid">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            2D drag and drop. Uniform items, responsive columns.
          </p>
          <div style={{ maxWidth: 400 }}>
            <ReorderableGrid
              items={gridItems}
              onChange={setGridItems}
              columns={3}
              renderItem={(item) => (
                <div style={{
                  background: item.color,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                }}>
                  {item.id}
                </div>
              )}
            />
          </div>
        </Section>

        {/* FileDropZone */}
        <Section title="FileDropZone">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Drag files from your desktop or click to browse.
          </p>
          <div style={{ maxWidth: 400 }}>
            <FileDropZone
              accept="image/*,.pdf"
              maxSize={5 * 1024 * 1024}
              onDrop={(file) => toast.success(`File selected: ${file.name}`)}
            />
          </div>
        </Section>

        {/* Milestone 9: FileUpload - REMOVED (depends on Skeleton Key services) */}
        {/* Milestone 10: CommentSection - REMOVED (depends on Skeleton Key AuthContext) */}

        <h1 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>📊 Milestone 11: Data Visualization</h1>

        {/* LineChart */}
        <Section title="LineChart">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Trends over time. Powered by recharts.
          </p>
          <LineChart
            data={[
              { month: 'Jan', users: 400, revenue: 240 },
              { month: 'Feb', users: 300, revenue: 139 },
              { month: 'Mar', users: 520, revenue: 380 },
              { month: 'Apr', users: 478, revenue: 390 },
              { month: 'May', users: 590, revenue: 480 },
              { month: 'Jun', users: 630, revenue: 520 },
            ]}
            xKey="month"
            lines={[
              { key: 'users', color: '#4A90D9', name: 'Users' },
              { key: 'revenue', color: '#5BAD6F', name: 'Revenue' },
            ]}
            showLegend
            height={250}
          />
        </Section>

        {/* BarChart */}
        <Section title="BarChart">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Comparisons between categories.
          </p>
          <BarChart
            data={[
              { name: 'Mon', tasks: 12 },
              { name: 'Tue', tasks: 19 },
              { name: 'Wed', tasks: 8 },
              { name: 'Thu', tasks: 15 },
              { name: 'Fri', tasks: 22 },
            ]}
            bars={[{ key: 'tasks', color: '#E8834A', name: 'Tasks Completed' }]}
            height={250}
          />
        </Section>

        {/* DonutChart */}
        <Section title="DonutChart">
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Proportions and distributions.
          </p>
          <div style={{ maxWidth: 400 }}>
            <DonutChart
              data={[
                { name: 'Desktop', value: 400 },
                { name: 'Mobile', value: 300 },
                { name: 'Tablet', value: 100 },
              ]}
              height={250}
            />
          </div>
        </Section>

        <h1 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>🪝 Hooks Library</h1>

        <HooksShowcase toast={toast} />
      </div>
    </>
  );
}

/**
 * Hooks Showcase Component
 * Separated for cleaner organization
 */
function HooksShowcase({ toast }) {
  // useMath demo
  const math = useMath(0, {
    min: -100,
    max: 100,
    onCommit: (val) => toast.success(`Committed value: ${val}`),
  });

  // useTimer countdown demo
  const countdown = useTimer({
    duration: 10,
    countdown: true,
    onComplete: () => toast.info('Countdown complete!'),
  });

  // useTimer stopwatch demo
  const stopwatch = useTimer({ countdown: false });

  // useToggle demo
  const [isOn, { toggle, setTrue, setFalse }] = useToggle(false);

  // useLocalStorage demo
  const [stored, setStored, removeStored] = useLocalStorage('demo-value', 'default');

  // useMediaQuery demo
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // useDebounce demo
  const [instantValue, setInstantValue] = useState('');
  const debouncedValue = useDebounce(instantValue, 500);

  // usePrevious demo
  const [counter, setCounter] = useState(0);
  const prevCounter = usePrevious(counter);

  // Milestone 1 hook demos
  // useCopyToClipboard
  const { copy, copied } = useCopyToClipboard();
  const sampleText = 'Hello from Skeleton Key!';

  // useNetworkStatus
  const { isOnline, isOffline } = useNetworkStatus();

  // useScrollPosition
  const { scrollY, isScrollingDown } = useScrollPosition();

  // useWindowSize
  const { width, height } = useWindowSize();

  // useInterval
  const [intervalCount, setIntervalCount] = useState(0);
  const [intervalRunning, setIntervalRunning] = useState(false);
  useInterval(
    () => setIntervalCount((c) => c + 1),
    intervalRunning ? 1000 : null
  );

  // useKeyPress demo
  const [lastKey, setLastKey] = useState('(press any key)');
  useKeyPress(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'], (e) => {
    setLastKey(e.key);
  });

  // useOnClickOutside demo
  const clickOutsideRef = useRef(null);
  const [boxClicked, setBoxClicked] = useState(false);
  useOnClickOutside(clickOutsideRef, () => setBoxClicked(false), boxClicked);

  // useIntersectionObserver demo
  const observerRef = useRef(null);
  const { isIntersecting } = useIntersectionObserver(observerRef, { threshold: 0.5 });

  // useUndoRedo demo
  const undoRedo = useUndoRedo('Hello', { bindKeys: false }); // Disable global keys for demo

  return (
    <>
      {/* useMath */}
      <Section title="useMath">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Numeric state with operations. "Local state as scratchpad, backend as ledger."
        </p>
        <Row>
          <Button size="sm" onClick={() => math.subtract(10)}>−10</Button>
          <Button size="sm" onClick={() => math.subtract(1)}>−1</Button>
          <span style={{
            minWidth: 60,
            textAlign: 'center',
            fontFamily: 'monospace',
            fontSize: 'var(--text-xl)',
            fontWeight: 'bold'
          }}>
            {math.value}
          </span>
          <Button size="sm" onClick={() => math.add(1)}>+1</Button>
          <Button size="sm" onClick={() => math.add(10)}>+10</Button>
        </Row>
        <Row>
          <Button size="sm" variant="secondary" onClick={() => math.multiply(2)}>×2</Button>
          <Button size="sm" variant="secondary" onClick={() => math.divide(2)}>÷2</Button>
          <Button size="sm" variant="ghost" onClick={math.reset}>Reset</Button>
          <Button size="sm" variant="primary" onClick={math.commit}>Commit</Button>
        </Row>
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Range: -100 to 100 • Commit sends to backend callback
        </p>
      </Section>

      {/* useTimer */}
      <Section title="useTimer">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Countdown and stopwatch modes with start/pause/reset.
        </p>
        <Row gap="var(--space-8)">
          <div>
            <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>Countdown (10s)</p>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 'var(--text-2xl)',
              marginBottom: 'var(--space-2)'
            }}>
              {formatTime(countdown.time)}
            </div>
            <Row>
              <Button size="sm" onClick={countdown.toggle}>
                {countdown.isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button size="sm" variant="ghost" onClick={countdown.reset}>Reset</Button>
            </Row>
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>Stopwatch</p>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 'var(--text-2xl)',
              marginBottom: 'var(--space-2)'
            }}>
              {formatTime(stopwatch.time)}
            </div>
            <Row>
              <Button size="sm" onClick={stopwatch.toggle}>
                {stopwatch.isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button size="sm" variant="ghost" onClick={stopwatch.reset}>Reset</Button>
            </Row>
          </div>
        </Row>
      </Section>

      {/* useToggle */}
      <Section title="useToggle">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Boolean state with toggle, setTrue, setFalse helpers.
        </p>
        <Row>
          <Badge variant={isOn ? 'success' : 'error'}>{isOn ? 'ON' : 'OFF'}</Badge>
          <Button size="sm" onClick={toggle}>toggle()</Button>
          <Button size="sm" variant="secondary" onClick={setTrue}>setTrue()</Button>
          <Button size="sm" variant="secondary" onClick={setFalse}>setFalse()</Button>
        </Row>
      </Section>

      {/* useLocalStorage */}
      <Section title="useLocalStorage">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Persistent state that survives refresh and syncs across tabs.
        </p>
        <Row>
          <input
            type="text"
            value={stored}
            onChange={(e) => setStored(e.target.value)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
            placeholder="Type something..."
          />
          <Button size="sm" variant="ghost" onClick={removeStored}>Clear</Button>
        </Row>
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Key: "demo-value" • Refresh page to see persistence
        </p>
      </Section>

      {/* useMediaQuery */}
      <Section title="useMediaQuery">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          React to CSS media queries in JS.
        </p>
        <Row>
          <Badge variant={isMobile ? 'warning' : 'info'}>
            {isMobile ? '📱 Mobile' : '💻 Desktop'}
          </Badge>
          <Badge variant={isDarkMode ? 'primary' : 'default'}>
            {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </Badge>
        </Row>
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Resize window to see changes • (max-width: 768px)
        </p>
      </Section>

      {/* useDebounce */}
      <Section title="useDebounce">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Debounce any value. Updates only after delay of inactivity.
        </p>
        <input
          type="text"
          value={instantValue}
          onChange={(e) => setInstantValue(e.target.value)}
          style={{
            padding: 'var(--space-2) var(--space-3)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            width: 250,
          }}
          placeholder="Type quickly..."
        />
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Instant: "{instantValue}" • Debounced (500ms): "{debouncedValue}"
        </p>
      </Section>

      {/* usePrevious */}
      <Section title="usePrevious">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Track the previous value of any state.
        </p>
        <Row>
          <Button size="sm" onClick={() => setCounter(c => c - 1)}>−1</Button>
          <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xl)' }}>{counter}</span>
          <Button size="sm" onClick={() => setCounter(c => c + 1)}>+1</Button>
        </Row>
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Current: {counter} • Previous: {prevCounter ?? '(none)'}
          {prevCounter !== undefined && (
            <> • Direction: {counter > prevCounter ? '↑' : counter < prevCounter ? '↓' : '='}</>
          )}
        </p>
      </Section>

      <h2 style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>
        Milestone 1 Hooks
      </h2>

      {/* useCopyToClipboard */}
      <Section title="useCopyToClipboard">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Copy any text to clipboard. Auto-resets "copied" state after 2s.
        </p>
        <Row>
          <code style={{
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'monospace',
          }}>
            {sampleText}
          </code>
          <Button size="sm" onClick={() => copy(sampleText)}>
            {copied ? '✓ Copied!' : 'Copy'}
          </Button>
        </Row>
      </Section>

      {/* useNetworkStatus */}
      <Section title="useNetworkStatus">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Detect online/offline status. Try disconnecting your network.
        </p>
        <Row>
          <Badge variant={isOnline ? 'success' : 'error'}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </Badge>
        </Row>
      </Section>

      {/* useScrollPosition */}
      <Section title="useScrollPosition">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Track scroll position and direction. Scroll this page to see values change.
        </p>
        <Row>
          <Badge variant="info">scrollY: {scrollY}px</Badge>
          <Badge variant={isScrollingDown ? 'warning' : 'success'}>
            {isScrollingDown ? '↓ Scrolling Down' : '↑ Scrolling Up'}
          </Badge>
        </Row>
        {scrollY > 200 && (
          <Button size="sm" variant="ghost" onClick={scrollToTop} style={{ marginTop: 'var(--space-2)' }}>
            ↑ Back to Top
          </Button>
        )}
      </Section>

      {/* useWindowSize */}
      <Section title="useWindowSize">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Live window dimensions. Resize the browser to see updates.
        </p>
        <Row>
          <Badge variant="info">Width: {width}px</Badge>
          <Badge variant="info">Height: {height}px</Badge>
        </Row>
      </Section>

      {/* useInterval */}
      <Section title="useInterval">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Safe setInterval wrapper. Pass null delay to pause.
        </p>
        <Row>
          <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xl)', minWidth: 40 }}>
            {intervalCount}
          </span>
          <Button size="sm" onClick={() => setIntervalRunning(!intervalRunning)}>
            {intervalRunning ? 'Pause' : 'Start'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setIntervalCount(0); setIntervalRunning(false); }}>
            Reset
          </Button>
        </Row>
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Increments every 1000ms when running
        </p>
      </Section>

      {/* useKeyPress */}
      <Section title="useKeyPress">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Listen for specific keypresses. Try arrow keys, Enter, or Escape.
        </p>
        <Row>
          <Badge variant="primary" style={{ fontFamily: 'monospace', fontSize: 'var(--text-lg)' }}>
            {lastKey}
          </Badge>
        </Row>
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Listening for: ↑ ↓ ← → Enter Escape
        </p>
      </Section>

      {/* useOnClickOutside */}
      <Section title="useOnClickOutside">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Detect clicks outside an element. Click the box, then click outside.
        </p>
        <div
          ref={clickOutsideRef}
          onClick={() => setBoxClicked(true)}
          style={{
            padding: 'var(--space-4)',
            background: boxClicked ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
            color: boxClicked ? 'white' : 'var(--color-text)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'inline-block',
            transition: 'all var(--transition-fast)',
          }}
        >
          {boxClicked ? 'Active! Click outside to close' : 'Click me to activate'}
        </div>
      </Section>

      {/* useIntersectionObserver */}
      <Section title="useIntersectionObserver">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Detect when element enters viewport. Scroll the box into view.
        </p>
        <div
          ref={observerRef}
          style={{
            padding: 'var(--space-6)',
            background: isIntersecting ? 'var(--color-success)' : 'var(--color-bg-secondary)',
            color: isIntersecting ? 'white' : 'var(--color-text)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            transition: 'all var(--transition-base)',
          }}
        >
          {isIntersecting ? '👁️ Visible! (50%+ in viewport)' : '📦 Scroll me into view'}
        </div>
      </Section>

      <h2 style={{ marginTop: 'var(--space-8)', marginBottom: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>
        Milestone 2: useUndoRedo
      </h2>

      {/* useUndoRedo */}
      <Section title="useUndoRedo">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Undo/redo stack for any value. Supports Ctrl+Z / Ctrl+Y when bindKeys is true.
        </p>
        <input
          type="text"
          value={undoRedo.value}
          onChange={(e) => undoRedo.setValue(e.target.value)}
          style={{
            padding: 'var(--space-2) var(--space-3)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            width: 250,
            marginBottom: 'var(--space-3)',
          }}
          placeholder="Type and use undo/redo..."
        />
        <Row>
          <Button size="sm" onClick={undoRedo.undo} disabled={!undoRedo.canUndo}>
            ↩ Undo
          </Button>
          <Button size="sm" onClick={undoRedo.redo} disabled={!undoRedo.canRedo}>
            Redo ↪
          </Button>
          <Button size="sm" variant="ghost" onClick={undoRedo.clear}>
            Clear History
          </Button>
        </Row>
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          History: {undoRedo.history.length} states • Index: {undoRedo.historyIndex}
          {' • '}
          {undoRedo.canUndo ? 'Can undo' : 'At beginning'}
          {' • '}
          {undoRedo.canRedo ? 'Can redo' : 'At end'}
        </p>
        <p style={{ marginTop: 'var(--space-1)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}>
          Stack: [{undoRedo.history.map((v, i) => i === undoRedo.historyIndex ? `[${v}]` : v).join(', ')}]
        </p>
      </Section>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 'var(--space-12)' }}>
      <h2 style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children, gap = 'var(--space-3)' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap, alignItems: 'center', marginBottom: 'var(--space-4)' }}>
      {children}
    </div>
  );
}
