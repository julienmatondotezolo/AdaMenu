import { Calendar, Check, Clock, Edit2, FileText, Folder, Plus, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";

import { useMenuMakerStore } from "../../stores/menumaker";
import { MenuProject } from "../../types/menumaker";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PageThumbnail } from "./PageThumbnail";

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

  // Load projects from localStorage
  useEffect(() => {
    const loadSavedProjects = () => {
      const savedProjects: ProjectInfo[] = [];

      // Iterate through localStorage to find menu maker projects
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && key.startsWith("menumaker_project_")) {
          try {
            const projectData = localStorage.getItem(key);

            if (projectData) {
              const project: MenuProject = JSON.parse(projectData);

              savedProjects.push({
                id: project.id,
                name: project.name,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                pageCount: project.pages.length,
                thumbnail: project.pages[0]?.thumbnail,
                firstPage: project.pages[0], // Store the first page for preview
              });
            }
          } catch (error) {
            console.warn(`Failed to load project from key ${key}:`, error);
          }
        }
      }

      // Sort by most recently updated
      savedProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setProjects(savedProjects);
    };

    loadSavedProjects();
  }, []);

  const handleOpenProject = (projectId: string) => {
    try {
      const projectData = localStorage.getItem(`menumaker_project_${projectId}`);

      if (projectData) {
        const project: MenuProject = JSON.parse(projectData);

        loadProject(project);
        onOpenProject();
      }
    } catch (error) {
      console.error("Failed to load project:", error);
      alert("Failed to load project. The project file may be corrupted.");
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      localStorage.removeItem(`menumaker_project_${projectId}`);
      setProjects(projects.filter((p) => p.id !== projectId));
      if (selectedProject === projectId) {
        setSelectedProject(null);
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

  const handleSaveRename = (projectId: string) => {
    if (editingName.trim() && editingName.trim() !== projects.find((p) => p.id === projectId)?.name) {
      try {
        const projectData = localStorage.getItem(`menumaker_project_${projectId}`);

        if (projectData) {
          const project: MenuProject = JSON.parse(projectData);
          const updatedProject = {
            ...project,
            name: editingName.trim(),
            updatedAt: new Date().toISOString(),
          };

          localStorage.setItem(`menumaker_project_${projectId}`, JSON.stringify(updatedProject));

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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Maker Projects</h1>
        <p className="text-gray-600">Manage your menu design projects</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex gap-4">
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`bg-white rounded-2xl border-2 transition-all cursor-pointer hover:shadow-lg overflow-hidden ${
                selectedProject === project.id ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300"
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
              <div className="h-64 bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                {project.firstPage ? (
                  <div className="w-full h-full">
                    <PageThumbnail page={project.firstPage} width={240} height={128} />
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">No preview</p>
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
                    <h3 className="font-semibold text-gray-900 truncate flex-1" title={project.name}>
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

                <div className="space-y-1 text-sm text-gray-500">
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
                      handleDeleteProject(project.id, project.name);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Create your first menu design project to get started</p>
          <Button onClick={onCreateNew} className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Create Your First Project
          </Button>
        </div>
      )}

      {/* Selected Project Actions */}
      {selectedProject && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border p-4 flex gap-2">
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
            onClick={() => {
              const project = projects.find((p) => p.id === selectedProject);

              if (project) {
                handleDeleteProject(project.id, project.name);
              }
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
