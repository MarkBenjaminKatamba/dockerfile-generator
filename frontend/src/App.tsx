import { useState, useContext } from 'react';
import {
  Container,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  CircularProgress,
  Backdrop,
  useTheme,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Moon icon
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Sun icon
import axios from 'axios';
import { ColorModeContext } from './main'; // Import the context

const languages = [
  'Python',
  'Node.js',
  'Java',
  'Go',
  'Ruby',
  'PHP',
  'Rust',
  'C#',
  'C++',
  'TypeScript',
];

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
};

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [tab, setTab] = useState(0); // 0: Dockerfile, 1: Workflow

  // Dockerfile tab state
  const [dfSpecs, setDfSpecs] = useState('');
  const [dfRepoPath, setDfRepoPath] = useState('');
  const [dfIncludeComments, setDfIncludeComments] = useState(false);
  const [dockerfile, setDockerfile] = useState('');
  const [dfExplanation, setDfExplanation] = useState('');
  const [dfShowExplanation, setDfShowExplanation] = useState(false);

  // Workflow tab state
  const [wfSpecs, setWfSpecs] = useState('');
  const [wfRepoPath, setWfRepoPath] = useState('');
  const [wfIncludeComments, setWfIncludeComments] = useState(false);
  const [workflow, setWorkflow] = useState('');
  const [wfExplanation, setWfExplanation] = useState('');
  const [wfShowExplanation, setWfShowExplanation] = useState(false);

  // Shared
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const theme = useTheme(); // Access the current theme for mode
  const colorMode = useContext(ColorModeContext); // Access toggle function

  const handleLanguageChange = (e: any) => {
    setSelectedLanguage(e.target.value);
    // Reset all tab states
    setDfSpecs(''); setDfRepoPath(''); setDfIncludeComments(false); setDockerfile(''); setDfExplanation(''); setDfShowExplanation(false);
    setWfSpecs(''); setWfRepoPath(''); setWfIncludeComments(false); setWorkflow(''); setWfExplanation(''); setWfShowExplanation(false);
  };

  const handleTabChange = (_: any, newValue: number) => {
    setTab(newValue);
  };

  // Dockerfile Tab Handlers
  const handleGenerateDockerfile = async () => {
    setLoading(true);
    setLoadingMessage('Generating Dockerfile...');
    setDockerfile(''); setDfExplanation(''); setDfShowExplanation(false);
    try {
      const response = await axios.post('/api/generate', {
        language: selectedLanguage,
        specifications: dfSpecs,
        repo_path: dfRepoPath,
        include_comments: dfIncludeComments,
      });
      setDockerfile(response.data.dockerfile);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error generating Dockerfile', severity: 'error' });
    } finally {
      setLoading(false); setLoadingMessage('');
    }
  };
  const handleExplainDockerfile = async () => {
    setLoading(true);
    setLoadingMessage('Generating Explanation...');
    setDfExplanation(''); setDfShowExplanation(false);
    try {
      const response = await axios.post('/api/explain', {
        language: selectedLanguage,
        specifications: dfSpecs,
        repo_path: dfRepoPath,
        include_comments: dfIncludeComments,
      });
      setDfExplanation(response.data.explanation);
      setDfShowExplanation(true);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error generating explanation', severity: 'error' });
    } finally {
      setLoading(false); setLoadingMessage('');
    }
  };
  const handleCopyDockerfile = () => {
    navigator.clipboard.writeText(dockerfile);
    setSnackbar({ open: true, message: 'Dockerfile copied to clipboard!', severity: 'success' });
  };

  // Workflow Tab Handlers
  const handleGenerateWorkflow = async () => {
    setLoading(true);
    setLoadingMessage('Generating GitHub Actions Workflow...');
    setWorkflow(''); setWfExplanation(''); setWfShowExplanation(false);
    try {
      const response = await axios.post('/api/generate_workflow', {
        language: selectedLanguage,
        specifications: wfSpecs,
        repo_path: wfRepoPath,
        include_comments: wfIncludeComments,
      });
      setWorkflow(response.data.workflow);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error generating workflow', severity: 'error' });
    } finally {
      setLoading(false); setLoadingMessage('');
    }
  };
  const handleExplainWorkflow = async () => {
    setLoading(true);
    setLoadingMessage('Generating Workflow Explanation...');
    setWfExplanation(''); setWfShowExplanation(false);
    try {
      const response = await axios.post('/api/explain', {
        language: selectedLanguage,
        specifications: wfSpecs,
        repo_path: wfRepoPath,
        include_comments: wfIncludeComments,
      });
      setWfExplanation(response.data.explanation);
      setWfShowExplanation(true);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error generating workflow explanation', severity: 'error' });
    } finally {
      setLoading(false); setLoadingMessage('');
    }
  };
  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(workflow);
    setSnackbar({ open: true, message: 'Workflow copied to clipboard!', severity: 'success' });
  };

  return (
    <Container maxWidth="md" sx={{ py: 6, bgcolor: 'background.default', borderRadius: '12px', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <IconButton onClick={colorMode.toggleColorMode} color="inherit">
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        DevOps AI Assistant – Local
      </Typography>
      
      <Paper sx={{ p: 4, mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Programming Language</InputLabel>
          <Select
            value={selectedLanguage}
            label="Programming Language"
            onChange={handleLanguageChange}
          >
            {languages.map((lang) => (
              <MenuItem key={lang} value={lang}>
                {lang}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Dockerfile Generator" />
          <Tab label="GitHub Actions Workflow Generator" />
        </Tabs>
        {tab === 0 && (
          <Box>
            <TextField
              label="Additional Specifications (optional)"
              placeholder="E.g., Use Python 3.11, multi-stage build, etc."
              value={dfSpecs}
              onChange={(e) => {
                if (e.target.value.length <= 2000) setDfSpecs(e.target.value);
              }}
              fullWidth
              multiline
              rows={3}
              inputProps={{ maxLength: 2000 }}
              sx={{ mb: 3 }}
              helperText={`${dfSpecs.length}/2000 characters`}
            />
            <TextField
              label="Local Repository Path (optional)"
              placeholder="E.g., /path/to/your/repo or C:\Users\user\repo"
              value={dfRepoPath}
              onChange={(e) => setDfRepoPath(e.target.value)}
              fullWidth
              sx={{ mb: 3 }}
              helperText="Provide a local path to your repository for more precise Dockerfile generation."
            />
            <FormControlLabel
              control={<Checkbox checked={dfIncludeComments} onChange={(e) => setDfIncludeComments(e.target.checked)} />}
              label="Include Comments in Dockerfile"
              sx={{ mb: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleGenerateDockerfile}
                disabled={!selectedLanguage}
                fullWidth
              >
                Generate Dockerfile
              </Button>
              <Button
                variant="outlined"
                onClick={handleExplainDockerfile}
                disabled={!dockerfile}
                fullWidth
              >
                Explain
              </Button>
            </Box>
            {dockerfile && (
              <Paper sx={{ p: 4, mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {`Generated ${selectedLanguage} Dockerfile:`}
                  </Typography>
                  <IconButton onClick={handleCopyDockerfile} size="small">
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderRadius: 1,
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '400px',
                  }}
                >
                  {dockerfile}
                </Box>
              </Paper>
            )}
            {dfShowExplanation && dfExplanation && (
              <Paper sx={{ p: 4, mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Explanation
                </Typography>
                <Typography
                  component="div"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    maxHeight: '600px',
                    overflowY: 'auto',
                    p: 1,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderRadius: '8px',
                  }}
                >
                  {dfExplanation}
                </Typography>
              </Paper>
            )}
          </Box>
        )}
        {tab === 1 && (
          <Box>
            <TextField
              label="Additional Specifications (optional)"
              placeholder="E.g., Use multi-stage build, push to GHCR, run tests, etc."
              value={wfSpecs}
              onChange={(e) => {
                if (e.target.value.length <= 2000) setWfSpecs(e.target.value);
              }}
              fullWidth
              multiline
              rows={3}
              inputProps={{ maxLength: 2000 }}
              sx={{ mb: 3 }}
              helperText={`${wfSpecs.length}/2000 characters`}
            />
            <TextField
              label="Local Repository Path (optional)"
              placeholder="E.g., /path/to/your/repo or C:\Users\user\repo"
              value={wfRepoPath}
              onChange={(e) => setWfRepoPath(e.target.value)}
              fullWidth
              sx={{ mb: 3 }}
              helperText="Provide a local path to your repository for more precise workflow generation."
            />
            <FormControlLabel
              control={<Checkbox checked={wfIncludeComments} onChange={(e) => setWfIncludeComments(e.target.checked)} />}
              label="Include Comments in Workflow"
              sx={{ mb: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleGenerateWorkflow}
                disabled={!selectedLanguage}
                fullWidth
              >
                Generate Workflow
              </Button>
              <Button
                variant="outlined"
                onClick={handleExplainWorkflow}
                disabled={!workflow}
                fullWidth
              >
                Explain
              </Button>
            </Box>
            {workflow && (
              <Paper sx={{ p: 4, mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    GitHub Actions Workflow:
                  </Typography>
                  <IconButton onClick={handleCopyWorkflow} size="small">
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderRadius: 1,
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '400px',
                  }}
                >
                  {workflow}
                </Box>
              </Paper>
            )}
            {wfShowExplanation && wfExplanation && (
              <Paper sx={{ p: 4, mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Explanation
                </Typography>
                <Typography
                  component="div"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    maxHeight: '600px',
                    overflowY: 'auto',
                    p: 1,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderRadius: '8px',
                  }}
                >
                  {wfExplanation}
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ mt: 2 }}>{loadingMessage}</Typography>
        </Box>
      </Backdrop>
    </Container>
  );
}

export default App; 