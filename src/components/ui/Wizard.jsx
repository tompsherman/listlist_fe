/**
 * Wizard / Multi-step Form Component
 * Controlled sequence of form steps with progress, navigation, and validation.
 * State accumulates across steps, submitted as one payload at the end.
 *
 * Pattern: Each step has its own Zod schema. Validation runs before advancing.
 */

import { useState, createContext, useContext, useCallback } from 'react';
import Button from './Button';
import ProgressBar from './ProgressBar';
import './Wizard.css';

const WizardContext = createContext(null);

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) throw new Error('useWizard must be used within Wizard');
  return context;
}

export function Wizard({
  children,
  initialData = {},
  onComplete,
  onStepChange,
  className = '',
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Count steps from children
  const steps = Array.isArray(children) ? children : [children];
  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Update form data for current step
  const updateData = useCallback((stepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  // Validate current step using its schema (if provided)
  const validateStep = useCallback(async (schema, stepData) => {
    if (!schema) return { success: true };

    try {
      await schema.parseAsync(stepData);
      setErrors({});
      return { success: true };
    } catch (err) {
      const fieldErrors = {};
      if (err.errors) {
        err.errors.forEach((e) => {
          const path = e.path.join('.');
          fieldErrors[path] = e.message;
        });
      }
      setErrors(fieldErrors);
      return { success: false, errors: fieldErrors };
    }
  }, []);

  // Go to next step
  const next = useCallback(async (schema, stepData) => {
    // Merge step data first
    const newData = { ...data, ...stepData };
    setData(newData);

    // Validate if schema provided
    const validation = await validateStep(schema, stepData);
    if (!validation.success) return false;

    if (isLastStep) {
      // Final submission
      setIsSubmitting(true);
      try {
        await onComplete?.(newData);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep((s) => s + 1);
      onStepChange?.(currentStep + 1, newData);
    }
    return true;
  }, [data, currentStep, isLastStep, validateStep, onComplete, onStepChange]);

  // Go to previous step
  const previous = useCallback(() => {
    if (isFirstStep) return;
    setErrors({});
    setCurrentStep((s) => s - 1);
    onStepChange?.(currentStep - 1, data);
  }, [isFirstStep, currentStep, data, onStepChange]);

  // Go to specific step (for step indicator clicks)
  const goToStep = useCallback((stepIndex) => {
    // Only allow going back, not forward (must validate to advance)
    if (stepIndex < currentStep) {
      setErrors({});
      setCurrentStep(stepIndex);
      onStepChange?.(stepIndex, data);
    }
  }, [currentStep, data, onStepChange]);

  const contextValue = {
    currentStep,
    totalSteps,
    data,
    errors,
    isFirstStep,
    isLastStep,
    isSubmitting,
    progress,
    updateData,
    next,
    previous,
    goToStep,
  };

  return (
    <WizardContext.Provider value={contextValue}>
      <div className={`wizard ${className}`}>
        {steps[currentStep]}
      </div>
    </WizardContext.Provider>
  );
}

export function WizardStep({
  children,
  title,
  description,
  schema,
  className = '',
}) {
  const {
    currentStep,
    totalSteps,
    data,
    errors,
    isFirstStep,
    isLastStep,
    isSubmitting,
    progress,
    next,
    previous,
  } = useWizard();

  // Collect step data from children forms
  const [stepData, setStepData] = useState({});

  const handleNext = async () => {
    await next(schema, stepData);
  };

  return (
    <div className={`wizard-step ${className}`}>
      {/* Progress */}
      <div className="wizard-progress">
        <ProgressBar value={progress} size="sm" />
        <span className="wizard-progress-text">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Header */}
      {(title || description) && (
        <div className="wizard-header">
          {title && <h2 className="wizard-title">{title}</h2>}
          {description && <p className="wizard-description">{description}</p>}
        </div>
      )}

      {/* Content */}
      <div className="wizard-content">
        {typeof children === 'function'
          ? children({ data, errors, updateData: setStepData, stepData })
          : children}
      </div>

      {/* Navigation */}
      <div className="wizard-nav">
        <Button
          variant="secondary"
          onClick={previous}
          disabled={isFirstStep || isSubmitting}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          loading={isSubmitting}
        >
          {isLastStep ? 'Submit' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

export function WizardStepIndicator({ className = '' }) {
  const { currentStep, totalSteps, goToStep } = useWizard();

  return (
    <div className={`wizard-indicators ${className}`}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`wizard-indicator ${i === currentStep ? 'wizard-indicator-active' : ''} ${i < currentStep ? 'wizard-indicator-complete' : ''}`}
          onClick={() => goToStep(i)}
          disabled={i > currentStep}
          aria-label={`Step ${i + 1}`}
        >
          {i < currentStep ? '✓' : i + 1}
        </button>
      ))}
    </div>
  );
}

export default Wizard;
