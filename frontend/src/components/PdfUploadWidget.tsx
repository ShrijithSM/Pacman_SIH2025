import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';

interface ExtractedInfo {
    university: string;
    documentType: string;
    extractedData: Record<string, any>;
    matchStatus: 'verified' | 'partial' | 'not_found';
    confidence: number;
    verification_details?: string[];
    taskId: string;
    filename: string;
    initialQuestion?: string;
    initialAnswer?: string;
}

interface QAResponse {
    question: string;
    answer: string;
    status: string;
}

interface PdfUploadWidgetProps {
    universityId?: string;
}

// Prefer relative API path in development so Vite proxy handles CORS
const deriveApiBase = () => {
    const envBase = (import.meta as any).env?.VITE_API_URL?.trim();
    // If explicitly set and looks like http(s), use it
    if (envBase && /^(https?:)?\/\//i.test(envBase)) return envBase.replace(/\/$/, '');
    // If set to relative root or empty, use relative
    if (!envBase || envBase === '/' ) return '';
    return envBase.replace(/\/$/, '');
};

const API_BASE_URL = deriveApiBase();
const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

export const PdfUploadWidget: React.FC<PdfUploadWidgetProps> = ({
    universityId = 'univ_001'
}) => {
    // Log the API URL on component mount for debugging
    React.useEffect(() => {
        console.log('🔧 PdfUploadWidget mounted with API_BASE_URL:', API_BASE_URL);
        console.log('🔧 Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
    }, []);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);
    const [error, setError] = useState<string>('');
    const [initialQuestion, setInitialQuestion] = useState<string>('');
    const [currentQuestion, setCurrentQuestion] = useState<string>('');
    const [qaResponses, setQaResponses] = useState<QAResponse[]>([]);
    const [askingQuestion, setAskingQuestion] = useState(false);

    const documentTypes = [
        { id: 'marksheet', label: 'Marksheet', icon: '📊' },
        { id: 'fees', label: 'Fee Receipt', icon: '💰' },
        { id: 'timetable', label: 'Timetable', icon: '📅' },
        { id: 'exam_schedule', label: 'Exam Schedule', icon: '📝' },
        { id: 'syllabus', label: 'Syllabus', icon: '📚' },
        { id: 'other', label: 'Other', icon: '📄' }
    ];

    const [selectedDocType, setSelectedDocType] = useState('marksheet');

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setError('Only PDF files are accepted. Please upload a valid PDF document.');
                return;
            }
            if (file.size > 15 * 1024 * 1024) {
                setError('File size too large. Please upload a PDF smaller than 15MB.');
                return;
            }
            setSelectedFile(file);
            setError('');
            setExtractedInfo(null);
            setQaResponses([]);
        }
    };

    const uploadAndProcess = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setProcessing(false);
        setUploadProgress(0);
        setError('');

        const formData = new FormData();
        formData.append('pdf', selectedFile);
        formData.append('documentType', selectedDocType);
        formData.append('universityId', universityId);

        if (initialQuestion.trim()) {
            formData.append('question', initialQuestion.trim());
        }

        try {
            const url = apiUrl('/api/upload-pdf');
            console.log('📤 Uploading to:', url, '| base =', API_BASE_URL || '(relative)');

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            console.log('📥 Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
            });

            if (response.ok) {
                const data = await response.json();
                setUploading(false);
                setProcessing(true);
                setUploadProgress(50);
                await pollProcessingStatus(data.taskId);
            } else {
                let detail = 'Upload failed. Please try again.';
                try {
                    const errorData = await response.json();
                    detail = errorData.detail || detail;
                } catch {}
                setError(detail);
                setUploading(false);
            }
        } catch (err: any) {
            console.error('💥 Upload error:', err);
            setError(`Network error: ${err?.message || err}. Check backend and CORS.`);
            setUploading(false);
        }
    };


    const pollProcessingStatus = async (taskId: string) => {
        const maxRetries = 60;
        let retries = 0;

        const poll = async () => {
            try {
                const url = apiUrl(`/api/processing-status/${taskId}`);
                const response = await fetch(url);

                if (!response.ok) {
                    setError('Failed to check processing status');
                    setProcessing(false);
                    return;
                }

                const data = await response.json();

                if (data.status === 'completed') {
                    setExtractedInfo(data.result);
                    setUploadProgress(100);
                    setProcessing(false);

                    if (data.result.initialQuestion && data.result.initialAnswer) {
                        setQaResponses([{
                            question: data.result.initialQuestion,
                            answer: data.result.initialAnswer,
                            status: 'success'
                        }]);
                    }
                } else if (data.status === 'error') {
                    setError(data.error || 'Processing failed');
                    setProcessing(false);
                } else if (data.status === 'processing' && retries < maxRetries) {
                    retries++;
                    setUploadProgress(50 + (retries / maxRetries) * 45);
                    setTimeout(poll, 1000);
                } else {
                    setError('Processing timeout. The document may be too complex.');
                    setProcessing(false);
                }
            } catch (err) {
                console.error('Polling error:', err);
                setError('Network error while checking processing status');
                setProcessing(false);
            }
        };

        poll();
    };

    const askQuestion = async () => {
        if (!currentQuestion.trim() || !extractedInfo) return;

        setAskingQuestion(true);
        setError('');

        const formData = new FormData();
        formData.append('task_id', extractedInfo.taskId);
        formData.append('question', currentQuestion.trim());

        try {
            const url = apiUrl('/api/ask-question');
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data: QAResponse = await response.json();
                setQaResponses(prev => [...prev, data]);
                setCurrentQuestion('');
            } else {
                let detail = 'Failed to process question';
                try {
                    const errorData = await response.json();
                    detail = (errorData as any).detail || detail;
                } catch {}
                setError(detail);
            }
        } catch (err) {
            console.error('Question error:', err);
            setError('Network error while processing question');
        } finally {
            setAskingQuestion(false);
        }
    };

    const getMatchStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'bg-green-500 text-white';
            case 'partial': return 'bg-yellow-500 text-black';
            case 'not_found': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getMatchStatusText = (status: string) => {
        switch (status) {
            case 'verified': return 'VERIFIED ✓';
            case 'partial': return 'PARTIALLY VERIFIED ⚠';
            case 'not_found': return 'NOT VERIFIED ✗';
            default: return 'UNKNOWN';
        }
    };

    const resetUpload = () => {
        setSelectedFile(null);
        setUploading(false);
        setProcessing(false);
        setUploadProgress(0);
        setExtractedInfo(null);
        setError('');
        setInitialQuestion('');
        setCurrentQuestion('');
        setQaResponses([]);
    };

    const handleKeyPress = (e: React.KeyboardEvent, isInitial: boolean = false) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            if (isInitial) {
                uploadAndProcess();
            } else {
                askQuestion();
            }
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        📄 Upload College Document & Ask Questions
                        {(extractedInfo || error) && (
                            <Button variant="outline" size="sm" onClick={resetUpload}>
                                New Upload
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Document Type Selection */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Document Type</label>
                        <Tabs value={selectedDocType} onValueChange={setSelectedDocType}>
                            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                                {documentTypes.map((type) => (
                                    <TabsTrigger key={type.id} value={type.id} className="text-xs">
                                        <span className="mr-1">{type.icon}</span>
                                        {type.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                        <p className="text-sm text-gray-500 mt-1">
                            Selected: {documentTypes.find(t => t.id === selectedDocType)?.label}
                        </p>
                    </div>

                    {/* University ID Display */}
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                        <strong>University ID:</strong> {universityId}
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Select PDF Document</label>
                        <Input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            disabled={uploading || processing}
                            className="mb-2"
                        />
                        {selectedFile && (
                            <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded border">
                                📁 <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                        )}
                    </div>

                    {/* Initial Question Input */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Ask a Question About the PDF (Optional)
                        </label>
                        <Textarea
                            placeholder="e.g., What is the student name? What are the marks obtained? When was this fee paid?"
                            value={initialQuestion}
                            onChange={(e) => setInitialQuestion(e.target.value)}
                            disabled={uploading || processing}
                            onKeyDown={(e) => handleKeyPress(e, true)}
                            className="resize-none"
                            rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Press Ctrl+Enter to upload and process, or leave blank to just extract document info
                        </p>
                    </div>

                    {/* Progress */}
                    {(uploading || processing) && (
                        <div className="space-y-2">
                            <Progress value={uploadProgress} className="w-full" />
                            <p className="text-sm text-center">
                                {uploading ? 'Uploading PDF...' : 'Processing document and extracting text...'}
                                {uploadProgress > 0 && ` (${Math.round(uploadProgress)}%)`}
                            </p>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Upload Button */}
                    <Button
                        onClick={uploadAndProcess}
                        disabled={!selectedFile || uploading || processing}
                        className="w-full"
                        size="lg"
                    >
                        {uploading ? 'Uploading...' :
                         processing ? 'Processing...' :
                         '📄 Upload & Process PDF'}
                    </Button>
                </CardContent>
            </Card>

            {/* Q&A Section - Only show after PDF is processed */}
            {extractedInfo && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            💬 Ask Questions About Your Document
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Ask any question about the uploaded document..."
                                value={currentQuestion}
                                onChange={(e) => setCurrentQuestion(e.target.value)}
                                onKeyDown={(e) => handleKeyPress(e, false)}
                                className="flex-1 resize-none"
                                rows={2}
                            />
                            <Button
                                onClick={askQuestion}
                                disabled={!currentQuestion.trim() || askingQuestion}
                                className="self-end"
                            >
                                {askingQuestion ? 'Processing...' : 'Ask'}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Press Ctrl+Enter to ask question
                        </p>

                        {/* Q&A History */}
                        {qaResponses.length > 0 && (
                            <div className="space-y-4 mt-6">
                                <Separator />
                                <h4 className="font-medium">Questions & Answers</h4>
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {qaResponses.map((qa, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                                            <div className="mb-2">
                                                <strong className="text-blue-600">Q:</strong> {qa.question}
                                            </div>
                                            <div className="text-gray-700">
                                                <strong className="text-green-600">A:</strong> {qa.answer}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Document Verification Results */}
            {extractedInfo && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🔍 Document Verification Results
                            <Badge className={getMatchStatusColor(extractedInfo.matchStatus)}>
                                {getMatchStatusText(extractedInfo.matchStatus)}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm font-medium">Document Name</p>
                                <p className="text-gray-600">{extractedInfo.filename}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Document Type</p>
                                <p className="text-gray-600">{extractedInfo.documentType}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Confidence Score</p>
                                <p className="text-gray-600">{Math.round(extractedInfo.confidence * 100)}%</p>
                            </div>
                        </div>

                        {/* Verification Details */}
                        {extractedInfo.verification_details && extractedInfo.verification_details.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2">Verification Details</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {extractedInfo.verification_details.map((detail, index) => (
                                        <li key={index} className="text-sm text-gray-600">✓ {detail}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Extracted Information */}
                        <div>
                            <h4 className="font-medium mb-2">Extracted Information</h4>
                            <div className="bg-gray-50 p-3 rounded text-sm max-h-60 overflow-y-auto border">
                                <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(extractedInfo.extractedData, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

