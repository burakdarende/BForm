// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: string;
  settings: {
    emailNotifications: boolean;
    whatsappNotifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// Form Field Types
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'date' 
  | 'time' 
  | 'datetime' 
  | 'file' 
  | 'rating' 
  | 'scale' 
  | 'yes-no';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface FieldSettings {
  multiple?: boolean;
  allowOther?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: FieldOption[];
  validation?: FieldValidation;
  settings?: FieldSettings;
}

// Form Types
export interface FormSettings {
  isPublic: boolean;
  allowMultipleSubmissions: boolean;
  requireAuth: boolean;
  submitButton: {
    text: string;
    color: string;
  };
  successMessage: string;
  redirectUrl?: string;
  notifications: {
    email: {
      enabled: boolean;
      to: string[];
      subject?: string;
      template?: string;
    };
    calendar: {
      enabled: boolean;
      title?: string;
      duration: number;
    };
    whatsapp: {
      enabled: boolean;
      template?: string;
      to?: string;
    };
  };
}

export interface FormStyling {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  theme?: string; // Theme class name
  customColors?: {
    primary?: string;
    background?: string;
    text?: string;
    inputBorder?: string;
    placeholder?: string;
  };
}

export interface Form {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  fields: FormField[];
  settings: FormSettings;
  styling: FormStyling;
  owner: string;
  isActive: boolean;
  submissionCount: number;
  lastSubmission?: string;
  createdAt: string;
  updatedAt: string;
}

// Response Types
export interface ResponseField {
  fieldId: string;
  fieldType: string;
  fieldLabel: string;
  value: any;
  files?: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }[];
}

export interface ResponseMetadata {
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  city?: string;
  referrer?: string;
}

export interface SubmitterInfo {
  email?: string;
  name?: string;
  phone?: string;
}

export interface ResponseNotifications {
  emailSent: boolean;
  calendarCreated: boolean;
  whatsappSent: boolean;
  calendarEventId?: string;
  emailMessageId?: string;
  whatsappMessageSid?: string;
}

export interface FormResponse {
  _id: string;
  form: string;
  formTitle: string;
  responses: ResponseField[];
  metadata: ResponseMetadata;
  submittedBy?: string;
  submitterInfo: SubmitterInfo;
  status: 'pending' | 'processed' | 'completed' | 'failed';
  processingNotes?: string;
  notifications: ResponseNotifications;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalCount: number;
  };
}

// Dashboard Types
export interface DashboardStats {
  totalForms: number;
  totalResponses: number;
  activeForms: number;
  weeklyResponses: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentForms: Form[];
  recentResponses: FormResponse[];
}

// Analytics Types
export interface ResponseStats {
  _id: string;
  count: number;
}

export interface FieldAnalytics {
  _id: string;
  fieldLabel: string;
  fieldType: string;
  totalResponses: number;
  values: any[];
}

export interface FormAnalytics {
  form: {
    id: string;
    title: string;
    slug: string;
    totalSubmissions: number;
  };
  responseStats: ResponseStats[];
  fieldAnalytics: FieldAnalytics[];
  period: number;
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// Form Builder Types
export interface FormBuilderState {
  form: Partial<Form>;
  currentField: FormField | null;
  isDirty: boolean;
  isPreviewMode: boolean;
}

export interface DraggedField {
  id: string;
  type: FieldType;
  label: string;
}

// Utility Types
export interface SelectOption {
  value: string;
  label: string;
}

export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}