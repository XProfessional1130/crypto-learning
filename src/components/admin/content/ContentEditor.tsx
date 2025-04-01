'use client';

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlock from '@tiptap/extension-code-block';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CharacterCount from '@tiptap/extension-character-count';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/api/supabase';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, 
  Link as LinkIcon, Image as ImageIcon, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table as TableIcon, Heading1, Heading2, Heading3, 
  CheckSquare, Undo, Redo, Eye, EyeOff, Save, Tag
} from 'lucide-react';

interface ContentEditorProps {
  contentId: string;
  onBack: () => void;
}

// Category interface
interface Category {
  id: string;
  name: string;
  slug: string;
}

// Separated BubbleMenu component to prevent hook order issues
const TipTapBubbleMenu = ({ 
  editor, 
  onLinkClick 
}: { 
  editor: any; 
  onLinkClick: () => void; 
}) => {
  if (!editor || !editor.isEditable) return null;
  
  return (
    <BubbleMenu 
      className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex" 
      editor={editor} 
      tippyOptions={{ 
        duration: 100,
        hideOnClick: true,
        arrow: false,
        appendTo: () => document.body
      }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 ${editor.isActive('bold') ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 ${editor.isActive('italic') ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 ${editor.isActive('underline') ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 ${editor.isActive('strike') ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-2 ${editor.isActive('code') ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        <Code className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-2 ${editor.isActive('highlight') ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">H</span>
      </button>
      <button
        onClick={onLinkClick}
        className={`p-2 ${editor.isActive('link') ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        <LinkIcon className="w-4 h-4" />
      </button>
    </BubbleMenu>
  );
};

// Loading component
const LoadingState = () => (
  <div className="p-8">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
      <div className="h-[500px] bg-gray-100 dark:bg-gray-800 rounded"></div>
    </div>
  </div>
);

export default function ContentEditor({ contentId, onBack }: ContentEditorProps) {
  // State hooks
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageForm, setShowImageForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Ref hooks
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Query hooks
  const queryClient = useQueryClient();
  
  // Data fetching
  const { data: content, isLoading } = useQuery({
    queryKey: ['content', contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch content categories relationship
  const { data: contentCategories, isLoading: contentCategoriesLoading } = useQuery({
    queryKey: ['content-categories', contentId],
    queryFn: async () => {
      if (!contentId || contentId === 'new') return [];
      
      const { data, error } = await supabase
        .from('content_to_categories')
        .select('category_id')
        .eq('content_id', contentId);

      if (error) throw error;
      return data.map(item => item.category_id);
    },
    enabled: !!contentId && contentId !== 'new',
  });
  
  // Set selected categories when content categories are loaded
  useEffect(() => {
    if (contentCategories) {
      setSelectedCategories(contentCategories);
    }
  }, [contentCategories]);
  
  // Editor instance
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer hover:text-blue-600',
        },
        validate: href => /^https?:\/\//.test(href),
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full my-4',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'rounded-md bg-gray-800 text-gray-200 p-4 my-4 overflow-x-auto font-mono',
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded',
        },
      }),
      Typography,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-medium',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-700 px-4 py-2',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-2',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start my-1',
        },
        nested: true,
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder: 'Start writing your content here...',
        emptyEditorClass: 'before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      // Could implement auto-save here
    },
  }, []);
  
  // Data mutation
  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const { error } = await supabase
        .from('content')
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq('id', contentId);
      
      if (error) throw error;

      // Update content categories
      if (selectedCategories.length > 0) {
        // First delete existing relationships
        await supabase
          .from('content_to_categories')
          .delete()
          .eq('content_id', contentId);
        
        // Then insert new relationships
        const categoryRelationships = selectedCategories.map(categoryId => ({
          content_id: contentId,
          category_id: categoryId
        }));
        
        const { error: relationshipError } = await supabase
          .from('content_to_categories')
          .insert(categoryRelationships);
        
        if (relationshipError) throw relationshipError;
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', contentId] });
      queryClient.invalidateQueries({ queryKey: ['content-categories', contentId] });
      toast.success('Content saved successfully');
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(`Error saving content: ${error.message}`);
      setIsSaving(false);
    }
  });
  
  // Action handlers - defined after the editor and mutation hooks
  const handleBubbleMenuLinkClick = useCallback(() => {
    setShowLinkForm(true);
  }, []);
  
  const handleSave = useCallback(() => {
    if (editor) {
      setIsSaving(true);
      saveMutation.mutate(editor.getHTML());
    }
  }, [editor, saveMutation]);
  
  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageForm(false);
    }
  }, [imageUrl, editor]);
  
  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      // If text is selected, update the selection with the link
      if (editor.state.selection.content().size > 0) {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      } else if (linkText) {
        // If no text is selected but link text is provided, insert new text with link
        editor.chain().focus().insertContent({
          type: 'text',
          text: linkText,
          marks: [{ type: 'link', attrs: { href: linkUrl } }]
        }).run();
      }
      
      setLinkUrl('');
      setLinkText('');
      setShowLinkForm(false);
    }
  }, [linkUrl, linkText, editor]);
  
  const insertTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  }, [editor]);
  
  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  }, []);
  
  // Effects - always defined in the same order
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);
  
  useEffect(() => {
    if (editor && content?.content && editor.isEditable) {
      try {
        editor.commands.setContent(content.content);
      } catch (err) {
        console.error("Error setting editor content:", err);
      }
    }
  }, [editor, content?.content]);
  
  // This effect prevents DOM manipulation conflicts when switching modes
  useEffect(() => {
    // When switching to preview mode, we need to make sure
    // TipTap doesn't try to manipulate the DOM simultaneously with React
    if (isPreviewMode && editor) {
      // Temporarily disable editor to prevent DOM operations
      const wasEditable = editor.isEditable;
      if (wasEditable) {
        editor.setEditable(false);
      }
      
      // Re-enable editor after React has finished its DOM updates
      return () => {
        if (wasEditable && editor) {
          // Small delay to ensure React operations are complete
          setTimeout(() => {
            editor.setEditable(true);
          }, 50);
        }
      };
    }
  }, [isPreviewMode, editor]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save on Ctrl+S or Command+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);
  
  // Show loading state
  if (isLoading) {
    return <LoadingState />;
  }
  
  // Get the editor HTML content only once per render to avoid TipTap DOM manipulations
  const editorHtml = editor ? editor.getHTML() : content?.content || '';
  
  // Safe handler for preview toggle
  const handleTogglePreview = (preview: boolean) => {
    // We need a short delay when turning on preview mode to ensure
    // TipTap has finished any ongoing DOM operations
    if (preview) {
      setTimeout(() => {
        setIsPreviewMode(true);
      }, 10);
    } else {
      setIsPreviewMode(false);
    }
  };
  
  // Render component
  return (
    <div className="max-w-6xl mx-auto">
      {/* Navigation and header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="mb-4 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Content List
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {content?.title || 'No Title Available'}
        </h1>
        
        {/* Content metadata bar */}
        <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
          <div className="flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              content?.status === 'published' ? 'bg-green-500' : 
              content?.status === 'scheduled' ? 'bg-amber-500' : 
              'bg-gray-400'
            }`}></span>
            {content?.status === 'published' ? (
              <span className="text-green-600 dark:text-green-400">Published</span>
            ) : content?.status === 'scheduled' ? (
              <span className="text-amber-600 dark:text-amber-400">Scheduled</span>
            ) : (
              <span>Draft</span>
            )}
          </div>
          <div>
            Last updated: {content?.updated_at ? new Date(content.updated_at).toLocaleDateString() : 'Never'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main editor area - 3/4 width on desktop */}
        <div className="lg:col-span-3 space-y-5">
          {/* Editor toolbar and content area */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Edit/Preview Toggle */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                <button
                  onClick={() => handleTogglePreview(false)}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center ${!isPreviewMode 
                    ? 'bg-white dark:bg-gray-600 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300'}`}
                >
                  <EyeOff className="w-4 h-4 mr-1.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleTogglePreview(true)}
                  className={`px-3 py-1.5 text-sm rounded-md flex items-center ${isPreviewMode 
                    ? 'bg-white dark:bg-gray-600 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300'}`}
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  Preview
                </button>
              </div>
              {editor && !isPreviewMode && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {editor.storage.characterCount.words()} words | 
                  {editor.storage.characterCount.characters()} characters
                </div>
              )}
            </div>

            {/* Editor toolbar - only show in edit mode */}
            {!isPreviewMode && editor && (
              <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <div className="p-2 flex flex-wrap gap-1 min-w-max">
                  {/* Text formatting */}
                  <div className="flex items-center mr-2 border-r border-gray-200 dark:border-gray-700 pr-2">
                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('bold') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('italic') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('underline') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Underline (Ctrl+U)"
                    >
                      <UnderlineIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('strike') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Strikethrough"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleHighlight().run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('highlight') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Highlight text"
                    >
                      <span className="w-4 h-4 flex items-center justify-center font-bold bg-yellow-200 text-yellow-800 rounded">H</span>
                    </button>
                  </div>

                  {/* Headings */}
                  <div className="flex items-center mr-2 border-r border-gray-200 dark:border-gray-700 pr-2">
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Heading 1"
                    >
                      <Heading1 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Heading 2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Heading 3"
                    >
                      <Heading3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lists */}
                  <div className="flex items-center mr-2 border-r border-gray-200 dark:border-gray-700 pr-2">
                    <button
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('bulletList') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('orderedList') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Ordered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        // Insert a task list with a task item
                        if (editor.isActive('taskList')) {
                          editor.chain().focus().liftListItem('taskItem').run();
                        } else {
                          editor.chain().focus()
                            .insertContent('<ul data-type="taskList"><li data-type="taskItem" data-checked="false">Task item</li></ul>')
                            .run();
                        }
                      }}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('taskList') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Task List"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Alignment */}
                  <div className="flex items-center mr-2 border-r border-gray-200 dark:border-gray-700 pr-2">
                    <button
                      onClick={() => editor.chain().focus().setTextAlign('left').run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().setTextAlign('center').run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Align Center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().setTextAlign('right').run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Align Right"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Justify"
                    >
                      <AlignJustify className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Special elements */}
                  <div className="flex items-center mr-2 border-r border-gray-200 dark:border-gray-700 pr-2">
                    <button
                      onClick={() => setShowLinkForm(true)}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('link') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Insert Link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowImageForm(true)}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Insert Image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={insertTable}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('table') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Insert Table"
                    >
                      <TableIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                      className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive('codeBlock') ? 'bg-gray-100 dark:bg-gray-700 text-blue-500' : ''}`}
                      title="Code Block"
                    >
                      <Code className="w-4 h-4" />
                    </button>
                  </div>

                  {/* History */}
                  <div className="flex items-center">
                    <button
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Redo (Ctrl+Shift+Z)"
                    >
                      <Redo className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Image form */}
                {showImageForm && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:text-white"
                      />
                      <button 
                        onClick={addImage}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                      >
                        Insert
                      </button>
                      <button 
                        onClick={() => setShowImageForm(false)}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Link form */}
                {showLinkForm && (
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="Enter URL"
                          className="flex-1 px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      {editor.state.selection.content().size === 0 && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            placeholder="Link text (optional)"
                            className="flex-1 px-3 py-2 border rounded-md text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button 
                          onClick={addLink}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                        >
                          {editor.state.selection.content().size > 0 ? 'Update Selection with Link' : 'Insert Link'}
                        </button>
                        <button 
                          onClick={() => setShowLinkForm(false)}
                          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Editor content area */}
            <div className="relative">
              {editor && !isPreviewMode && <TipTapBubbleMenu editor={editor} onLinkClick={handleBubbleMenuLinkClick} />}
              
              {isPreviewMode ? (
                <div className="p-6">
                  <div 
                    className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none" 
                    dangerouslySetInnerHTML={{ __html: editorHtml }}
                  />
                </div>
              ) : (
                <EditorContent editor={editor} className="min-h-[500px] focus-within:ring-blue-500 focus-within:ring-opacity-50" />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - 1/4 width on desktop */}
        <div className="space-y-5">
          {/* Save button - now more prominent in sidebar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <button
              onClick={handleSave}
              disabled={isSaving || saveMutation.isPending}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving || saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              You can also press Ctrl+S to save
            </p>
          </div>

          {/* Keyboard shortcuts section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Save</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Bold</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">Ctrl+B</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Italic</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">Ctrl+I</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Underline</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">Ctrl+U</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Undo</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">Ctrl+Z</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Redo</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200 font-mono">Ctrl+Shift+Z</kbd>
              </div>
            </div>
          </div>

          {/* Categories section - moved to sidebar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-center mb-3">
              <Tag className="w-4 h-4 mr-2 text-gray-700 dark:text-gray-300" />
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">Categories</h3>
            </div>
            
            {categoriesLoading ? (
              <div className="space-y-2">
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ) : categories && categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`w-full px-3 py-1.5 text-sm rounded-md flex items-center justify-between ${
                      selectedCategories.includes(category.id)
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors'
                    }`}
                  >
                    <span>{category.name}</span>
                    {selectedCategories.includes(category.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No categories available</p>
            )}
          </div>

          {/* Additional metadata section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-3">Content Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Type:</span>
                <span className="font-medium">{content?.type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Visibility:</span>
                <span className="font-medium">{content?.visibility || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Created:</span>
                <span className="font-medium">{content?.created_at ? new Date(content.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              {content?.published_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Published:</span>
                  <span className="font-medium">{new Date(content.published_at).toLocaleDateString()}</span>
                </div>
              )}
              {content?.view_count !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Views:</span>
                  <span className="font-medium">{content.view_count}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 