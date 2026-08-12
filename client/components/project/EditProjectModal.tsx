'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import {
  getRequestTemplateError,
  SIMPLE_REQUEST_TEMPLATE,
} from '@/lib/agentContract';
import { Project, UpdateProjectRequest } from '@/types';
import { Key } from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export default function EditProjectModal({
  isOpen,
  onClose,
  project,
}: EditProjectModalProps) {
  const [name, setName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [requiresToken, setRequiresToken] = useState(false);
  const [requestBodyTemplate, setRequestBodyTemplate] = useState(SIMPLE_REQUEST_TEMPLATE);
  const [responsePath, setResponsePath] = useState('answer');
  const [showTokenField, setShowTokenField] = useState(false);
  const [token, setToken] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (project) {
      setName(project.name);
      setEndpointUrl(project.endpoint_url);
      setRequiresToken(project.requires_token);
      setRequestBodyTemplate(project.request_body_template);
      setResponsePath(project.response_path);
    }
  }, [project, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: UpdateProjectRequest) =>
      apiClient.updateProject(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully!');
      onClose();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update project'));
    },
  });

  const tokenMutation = useMutation({
    mutationFn: (tokenData: { token: string }) =>
      apiClient.updateProjectToken(project.id, tokenData),
    onSuccess: () => {
      toast.success('Token updated successfully!');
      setToken('');
      setShowTokenField(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update token'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (!endpointUrl.trim()) {
      toast.error('Endpoint URL is required');
      return;
    }

    const urlPattern = /^(https?|wss?):\/\/.+/;
    if (!urlPattern.test(endpointUrl)) {
      toast.error('Endpoint URL must start with http://, https://, ws://, or wss://');
      return;
    }

    const templateError = getRequestTemplateError(requestBodyTemplate);
    if (templateError) {
      toast.error(templateError);
      return;
    }

    if (!responsePath.trim()) {
      toast.error('Answer path is required');
      return;
    }

    mutation.mutate({
      name: name.trim(),
      endpoint_url: endpointUrl.trim(),
      requires_token: requiresToken,
      request_body_template: requestBodyTemplate.trim(),
      response_path: responsePath.trim(),
    });
  };

  const handleTokenUpdate = () => {
    if (!token.trim()) {
      toast.error('Token is required');
      return;
    }
    tokenMutation.mutate({ token: token.trim() });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My AI Agent"
          required
        />

        <Input
          label="Endpoint URL"
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
          placeholder="http://localhost:5000/chat"
          required
        />

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresToken}
              onChange={(e) => setRequiresToken(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Requires Authentication Token</span>
          </label>
        </div>

        {requiresToken && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Authentication Token</span>
              </div>
              {!showTokenField && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowTokenField(true)}
                >
                  Update Token
                </Button>
              )}
            </div>
            {showTokenField ? (
              <div className="space-y-3">
                <Input
                  label="New Token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter new authentication token"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleTokenUpdate}
                    isLoading={tokenMutation.isPending}
                  >
                    Save Token
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setShowTokenField(false);
                      setToken('');
                    }}
                    disabled={tokenMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-blue-700">
                Token is securely stored. Click "Update Token" to change it.
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="edit-request-template" className="mb-1.5 block text-sm font-medium text-gray-700">
            Request JSON template
          </label>
          <textarea
            id="edit-request-template"
            rows={7}
            value={requestBodyTemplate}
            onChange={(event) => setRequestBodyTemplate(event.target.value)}
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 font-mono text-xs leading-5 text-cyan-100 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            spellCheck={false}
            required
          />
          <p className="mt-1 text-xs text-gray-500">Use {'{{message}}'} where APREP should insert each question.</p>
        </div>

        <Input
          label="Answer Path"
          value={responsePath}
          onChange={(e) => setResponsePath(e.target.value)}
          placeholder="data.results[0].answer"
          required
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Made with Bob
