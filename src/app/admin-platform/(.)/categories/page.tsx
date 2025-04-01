'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '@/lib/api/supabase';
import { Dialog, Transition } from '@headlessui/react';
import { PlusCircle, Edit, Trash2, Tags, AlertCircle, X, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCategory() {
    try {
      if (!name.trim()) return;
      
      // Generate slug if not provided
      const categorySlug = slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-');
      
      const { error } = await supabase
        .from('content_categories')
        .insert([{ 
          name: name.trim(), 
          slug: categorySlug,
          description: description.trim() 
        }]);
      
      if (error) throw error;
      
      // Reset form and refresh categories
      setName('');
      setSlug('');
      setDescription('');
      await fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  }

  function handleEdit(category: Category) {
    setCurrentCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || '');
    setIsModalOpen(true);
  }

  async function handleUpdateCategory() {
    if (!currentCategory) return;
    
    try {
      const { error } = await supabase
        .from('content_categories')
        .update({ 
          name: name.trim(), 
          slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
          description: description.trim() 
        })
        .eq('id', currentCategory.id);
      
      if (error) throw error;
      
      // Reset form, close modal and refresh categories
      setCurrentCategory(null);
      setName('');
      setSlug('');
      setDescription('');
      setIsModalOpen(false);
      await fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  }

  function openDeleteConfirmation(id: string) {
    setCategoryToDelete(id);
    setConfirmDeleteOpen(true);
  }

  async function handleDeleteCategory() {
    if (!categoryToDelete) return;
    
    try {
      setIsDeleting(true);
      // Check if category is used by any content
      const { data: usageData, error: usageError } = await supabase
        .from('content_to_categories')
        .select('content_id')
        .eq('category_id', categoryToDelete);
      
      if (usageError) throw usageError;
      
      // If category is in use, don't delete
      if (usageData && usageData.length > 0) {
        setConfirmDeleteOpen(false);
        setCategoryToDelete(null);
        setIsDeleting(false);
        alert(`Cannot delete: This category is used by ${usageData.length} content items.`);
        return;
      }
      
      // If not in use, delete the category
      const { error } = await supabase
        .from('content_categories')
        .delete()
        .eq('id', categoryToDelete);
      
      if (error) throw error;
      
      setConfirmDeleteOpen(false);
      setCategoryToDelete(null);
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setCurrentCategory(null);
    setName('');
    setSlug('');
    setDescription('');
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Tags className="h-7 w-7 text-brand-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Categories</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Categories</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organize your content with categories for better navigation and discovery
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Tags className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No categories yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
              Categories help organize your content. Create your first category to get started.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                <tr>
                  <th scope="col" className="px-6 py-3 font-medium">Name</th>
                  <th scope="col" className="px-6 py-3 font-medium">Slug</th>
                  <th scope="col" className="px-6 py-3 font-medium">Description</th>
                  <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category) => (
                  <tr key={category.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{category.name}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{category.slug}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{category.description || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1.5 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Edit category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirmation(category.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                          aria-label="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Category Modal */}
      <Transition appear show={isModalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                    >
                      {currentCategory ? 'Edit Category' : 'Add New Category'}
                    </Dialog.Title>
                    <button
                      onClick={closeModal}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-2 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        placeholder="Category name"
                        value={name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Slug
                      </label>
                      <input
                        type="text"
                        id="slug"
                        placeholder="category-slug"
                        value={slug}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Leave empty to generate from name</p>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        id="description"
                        placeholder="Brief description of this category"
                        value={description}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={currentCategory ? handleUpdateCategory : handleCreateCategory}
                      disabled={!name.trim()}
                      className="inline-flex justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentCategory ? 'Update' : 'Create'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={confirmDeleteOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isDeleting && setConfirmDeleteOpen(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6"
                    >
                      Delete Category
                    </Dialog.Title>
                  </div>

                  <div className="mt-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Are you sure you want to delete this category? This action cannot be undone.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOpen(false)}
                      disabled={isDeleting}
                      className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteCategory}
                      disabled={isDeleting}
                      className="inline-flex justify-center items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 