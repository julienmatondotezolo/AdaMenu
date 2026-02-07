/* eslint-disable prettier/prettier */
import { Calendar, Check, Clock, Download, Edit2, FileText, Folder, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { indexedDBService } from "../../lib/indexedDBService";
import { useMenuMakerStore } from "../../stores/menumaker";
import { MenuProject } from "../../types/menumaker";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AIImportModal } from "./AIImportModal";
import { PageThumbnail } from "./PageThumbnail";
import { SchemaViewer } from "./SchemaViewer";

interface ProjectManagerProps {
  onCreateNew: () => void;
  onOpenProject: () => void;
}

interface ProjectInfo {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
  thumbnail?: string;
  firstPage?: any; // Store the first page for preview
}

export function ProjectManager({ onCreateNew, onOpenProject }: ProjectManagerProps) {
  const { loadProject } = useMenuMakerStore();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [showAIImport, setShowAIImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects from IndexedDB
  useEffect(() => {
    const loadSavedProjects = async () => {
      try {
        const savedProjects = await indexedDBService.getAllProjects();

        setProjects(savedProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    loadSavedProjects();
  }, []);

  const handleOpenProject = async (projectId: string) => {
    try {
      const project = await indexedDBService.getProject(projectId);

      if (project) {
        loadProject(project);
        onOpenProject();
      } else {
        alert("Project not found.");
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      alert("Failed to load project. The project file may be corrupted.");
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      try {
        await indexedDBService.deleteProject(projectId);
        setProjects(projects.filter((p) => p.id !== projectId));
        if (selectedProject === projectId) {
          setSelectedProject(null);
        }
      } catch (error) {
        console.error("Failed to delete project:", error);
        alert("Failed to delete project. Please try again.");
      }
    }
  };

  const handleStartRename = (projectId: string, currentName: string) => {
    setEditingProject(projectId);
    setEditingName(currentName);
  };

  const handleCancelRename = () => {
    setEditingProject(null);
    setEditingName("");
  };

  const handleSaveRename = async (projectId: string) => {
    if (editingName.trim() && editingName.trim() !== projects.find((p) => p.id === projectId)?.name) {
      try {
        const project = await indexedDBService.getProject(projectId);

        if (project) {
          const updatedProject = {
            ...project,
            name: editingName.trim(),
            updatedAt: new Date().toISOString(),
          };

          await indexedDBService.saveProject(updatedProject);

          // Update local state
          setProjects(
            projects.map((p) =>
              p.id === projectId
                ? {
                  ...p,
                  name: editingName.trim(),
                  updatedAt: updatedProject.updatedAt,
                  firstPage: updatedProject.pages[0], // Update first page in case it changed
                }
                : p,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to rename project:", error);
        alert("Failed to rename project. Please try again.");
      }
    }
    setEditingProject(null);
    setEditingName("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // JSON Schema validation function
  const validateMenuProject = (data: any): data is MenuProject => {
    try {
      // Basic type checking for required fields
      if (typeof data !== 'object' || data === null) return false;
      if (typeof data.id !== 'string') return false;
      if (typeof data.name !== 'string') return false;
      if (typeof data.createdAt !== 'string') return false;
      if (typeof data.updatedAt !== 'string') return false;
      if (!Array.isArray(data.pages)) return false;
      if (typeof data.settings !== 'object') return false;

      // Validate pages structure
      for (const page of data.pages) {
        if (typeof page !== 'object' || page === null) return false;
        if (typeof page.id !== 'string') return false;
        if (typeof page.name !== 'string') return false;
        if (typeof page.format !== 'object') return false;
        if (typeof page.backgroundColor !== 'string') return false;
        if (!Array.isArray(page.layers)) return false;

        // Validate layers structure
        for (const layer of page.layers) {
          if (typeof layer !== 'object' || layer === null) return false;
          if (typeof layer.id !== 'string') return false;
          if (typeof layer.name !== 'string') return false;
          if (typeof layer.visible !== 'boolean') return false;
          if (typeof layer.locked !== 'boolean') return false;
          if (typeof layer.opacity !== 'number') return false;
          if (!Array.isArray(layer.elements)) return false;

          // Validate elements structure
          for (const element of layer.elements) {
            if (typeof element !== 'object' || element === null) return false;
            if (typeof element.id !== 'string') return false;
            if (!['text', 'image', 'background', 'data', 'shape'].includes(element.type)) return false;
            if (typeof element.x !== 'number') return false;
            if (typeof element.y !== 'number') return false;
            if (typeof element.width !== 'number') return false;
            if (typeof element.height !== 'number') return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  };

  const handleImportProject = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Reset the input
    event.target.value = '';

    if (file.type !== 'application/json') {
      alert('Please select a JSON file.');
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate against schema
      if (!validateMenuProject(data)) {
        alert('Invalid menu project file. The file does not match the required schema.');
        return;
      }

      // Generate new ID and update timestamps to avoid conflicts
      const importedProject: MenuProject = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        name: `${data.name} (Imported)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to IndexedDB
      await indexedDBService.saveProject(importedProject);

      // Refresh the projects list
      const savedProjects = await indexedDBService.getAllProjects();

      setProjects(savedProjects);

      alert(`Project "${importedProject.name}" imported successfully!`);
    } catch (error) {
      console.error('Import error:', error);
      if (error instanceof SyntaxError) {
        alert('Invalid JSON file. Please check the file format.');
      } else {
        alert('Failed to import project. Please try again.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const refreshProjects = async () => {
    try {
      const savedProjects = await indexedDBService.getAllProjects();
      setProjects(savedProjects);
    } catch (error) {
      console.error('Failed to refresh projects:', error);
    }
  };

  const handleExportProject = async (projectId: string) => {
    try {
      const project = await indexedDBService.getProject(projectId);

      if (!project) {
        alert('Project not found.');
        return;
      }

      // Create JSON blob
      const jsonString = JSON.stringify(project, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_menu_project.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Project "${project.name}" exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export project. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Menu Maker Projects</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your menu design projects</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Project
        </Button>
        
        <Button
          onClick={() => setShowAIImport(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          <Sparkles className="w-4 h-4" />
          AI Import
        </Button>

        <Button 
          onClick={handleImportProject} 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={isImporting}
        >
          <Upload className="w-4 h-4" />
          {isImporting ? 'Importing...' : 'Import Project'}
        </Button>

        {selectedProject && (
          <Button 
            onClick={() => handleExportProject(selectedProject)} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Selected
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-lg overflow-hidden ${
                selectedProject === project.id ? "border-blue-500 shadow-lg" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
              onClick={() => setSelectedProject(project.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedProject(project.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Select project: ${project.name}`}
            >
              {/* Project Thumbnail */}
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex items-center justify-center overflow-hidden">
                {project.firstPage ? (
                  <div className="w-full h-full">
                    <PageThumbnail page={project.firstPage} width={240} height={128} />
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">No preview</p>
                  </div>
                )}
              </div>

              {/* Project Details */}
              <div className="p-4">
                {editingProject === project.id ? (
                  <div className="mb-2 flex items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveRename(project.id);
                        } else if (e.key === "Escape") {
                          handleCancelRename();
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveRename(project.id)}
                      className="p-1 h-7 w-7"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancelRename} className="p-1 h-7 w-7">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="mb-2 flex items-center gap-2 group">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1" title={project.name}>
                      {project.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(project.id, project.name);
                      }}
                      className="p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Folder className="w-3 h-3" />
                    <span>
                      {project.pageCount} page{project.pageCount !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Created {formatDate(project.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Updated {formatDate(project.updatedAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProject(project.id);
                    }}
                    className="flex-1"
                  >
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportProject(project.id);
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                    title="Export Project"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id, project.name);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No projects yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Create your first menu design project to get started</p>
          <Button onClick={onCreateNew} className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Create Your First Project
          </Button>
        </div>
      )}

      {/* Selected Project Actions */}
      {selectedProject && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex gap-2">
          <Button
            onClick={() => {
              const project = projects.find((p) => p.id === selectedProject);

              if (project) {
                handleOpenProject(project.id);
              }
            }}
            className="flex items-center gap-2"
          >
            Open Project
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportProject(selectedProject)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const project = projects.find((p) => p.id === selectedProject);

              if (project) {
                handleDeleteProject(project.id, project.name);
              }
            }}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Import/Export Info Card */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📁 Import & Export Projects
        </h3>
        <div className="text-sm text-blue-700 dark:text-blue-200 space-y-2">
          <p>
            <strong>Import:</strong> Upload JSON files that follow the Menu Project Schema. 
            Imported projects will be validated and automatically saved to your local storage.
          </p>
          <p>
            <strong>Export:</strong> Download your projects as JSON files for backup, sharing, or migration. 
            Exported files include all pages, layers, elements, and project settings.
          </p>
          <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800/30 rounded border border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-600 dark:text-blue-300">
               💡 <strong>Tip:</strong> All imported and exported files follow the MENU_PROJECT_SCHEMA for maximum compatibility.
            </p>
            <SchemaViewer />
          </div>
        </div>
      </div>

      {/* AI Import Modal */}
      <AIImportModal
        open={showAIImport}
        onClose={() => setShowAIImport(false)}
        onImported={refreshProjects}
      />
    </div>
  );
}
