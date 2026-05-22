import { useState } from 'react';
import {
  FileQuestion,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Scale,
  Wrench,
  Globe,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface Template {
  id: string;
  category: string;
  icon: React.ElementType;
  title: string;
  template: string;
  variables: string[];
}

interface QueryTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: string) => void;
}

const templates: Template[] = [
  // HR Templates
  {
    id: 'hr-1',
    category: 'HR & Policy',
    icon: Briefcase,
    title: 'Leave Policy Query',
    template: 'What is the {leave_type} policy for employees with {tenure} years of service?',
    variables: ['leave_type', 'tenure'],
  },
  {
    id: 'hr-2',
    category: 'HR & Policy',
    icon: Briefcase,
    title: 'Benefits Information',
    template: 'Explain the {benefit_type} benefits available to {employee_level} employees.',
    variables: ['benefit_type', 'employee_level'],
  },
  {
    id: 'hr-3',
    category: 'HR & Policy',
    icon: Briefcase,
    title: 'Process/Procedure',
    template: 'What is the step-by-step process for {action}?',
    variables: ['action'],
  },

  // Academic Templates
  {
    id: 'acad-1',
    category: 'Academic',
    icon: GraduationCap,
    title: 'Concept Explanation',
    template: 'Explain {concept} as described in {paper/document}, including key formulas.',
    variables: ['concept', 'paper/document'],
  },
  {
    id: 'acad-2',
    category: 'Academic',
    icon: GraduationCap,
    title: 'Compare Methods',
    template: 'Compare {method_1} vs {method_2} based on the research papers.',
    variables: ['method_1', 'method_2'],
  },
  {
    id: 'acad-3',
    category: 'Academic',
    icon: GraduationCap,
    title: 'Key Findings',
    template: 'What are the main findings and contributions of {paper_title}?',
    variables: ['paper_title'],
  },

  // Legal Templates
  {
    id: 'legal-1',
    category: 'Legal',
    icon: Scale,
    title: 'Compliance Check',
    template: 'Is {action/practice} compliant with our policies? Cite relevant sections.',
    variables: ['action/practice'],
  },
  {
    id: 'legal-2',
    category: 'Legal',
    icon: Scale,
    title: 'Requirements List',
    template: 'List all requirements for {process} according to compliance documents.',
    variables: ['process'],
  },

  // Technical Templates
  {
    id: 'tech-1',
    category: 'Technical',
    icon: Wrench,
    title: 'Troubleshooting',
    template: 'How do I troubleshoot error {error_code} on {product/system}?',
    variables: ['error_code', 'product/system'],
  },
  {
    id: 'tech-2',
    category: 'Technical',
    icon: Wrench,
    title: 'Configuration Guide',
    template: 'What are the configuration steps for {feature} in {product}?',
    variables: ['feature', 'product'],
  },

  // Urdu Templates
  {
    id: 'urdu-1',
    category: 'اردو',
    icon: Globe,
    title: 'عمومی سوال',
    template: '{موضوع} کے بارے میں تفصیلات فراہم کریں۔',
    variables: ['موضوع'],
  },
  {
    id: 'urdu-2',
    category: 'اردو',
    icon: Globe,
    title: 'پالیسی سوال',
    template: '{پالیسی کا نام} کے اہم نکات کیا ہیں؟',
    variables: ['پالیسی کا نام'],
  },
];

const categories = [...new Set(templates.map((t) => t.category))];

export default function QueryTemplates({ isOpen, onClose, onSelectTemplate }: QueryTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.category === selectedCategory)
    : templates;

  const handleUseTemplate = (template: Template) => {
    let finalTemplate = template.template;
    template.variables.forEach((variable) => {
      const value = customVariables[`${template.id}-${variable}`] || `[${variable}]`;
      finalTemplate = finalTemplate.replace(`{${variable}}`, value);
    });
    onSelectTemplate(finalTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[80vh] bg-surface-light border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-primary-400" />
            <h3 className="text-sm font-semibold text-white">Query Templates</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              !selectedCategory
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                : 'text-dark-400 hover:bg-surface-hover'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                selectedCategory === cat
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-dark-400 hover:bg-surface-hover'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 rounded-xl bg-surface-card border border-border hover:border-primary-500/30 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center flex-shrink-0">
                  <template.icon className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white">{template.title}</h4>
                    <span className="text-[10px] text-dark-500 px-1.5 py-0.5 rounded bg-surface">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 font-mono bg-surface/50 px-2 py-1.5 rounded-lg">
                    {template.template}
                  </p>

                  {/* Variable inputs */}
                  {template.variables.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.variables.map((variable) => (
                        <input
                          key={variable}
                          type="text"
                          placeholder={variable}
                          value={customVariables[`${template.id}-${variable}`] || ''}
                          onChange={(e) =>
                            setCustomVariables({
                              ...customVariables,
                              [`${template.id}-${variable}`]: e.target.value,
                            })
                          }
                          className="px-2 py-1 rounded-lg bg-surface border border-border text-xs text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 w-32"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-all"
                >
                  Use
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-surface flex items-center justify-between">
          <span className="text-xs text-dark-500">
            {filteredTemplates.length} templates available
          </span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-dark-400 hover:bg-surface-hover hover:text-white transition-colors">
            <Plus className="w-3 h-3" />
            Create Custom Template
          </button>
        </div>
      </div>
    </div>
  );
}
