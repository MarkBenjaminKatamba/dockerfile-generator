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
  const [specifications, setSpecifications] = useState('');
  const [repoUrl, setRepoUrl] = useState(''); // New state for repo URL
  const [dockerfile, setDockerfile] = useState('');
  const [explanation, setExplanation] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [includeComments, setIncludeComments] = useState(false); // New state for comments, default to false

  const theme = useTheme(); // Access the current theme for mode
  const colorMode = useContext(ColorModeContext); // Access toggle function

  const handleLanguageChange = (e: any) => {
    setSelectedLanguage(e.target.value);
    setSpecifications('');
    setRepoUrl(''); // Clear repo URL on language change
    setDockerfile('');
    setExplanation('');
    setShowExplanation(false);
    setIncludeComments(false); // Reset comments checkbox to default on language change
  };

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingMessage('Generating Dockerfile...');
    try {
      const response = await axios.post('/api/generate', { 
        language: selectedLanguage, 
        specifications, 
        repo_url: repoUrl, 
        include_comments: includeComments // Pass includeComments
      });
      setDockerfile(response.data.dockerfile);
      setExplanation('');
      setShowExplanation(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error generating Dockerfile', severity: 'error' });
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleExplain = async () => {
    setLoading(true);
    setLoadingMessage('Generating Explanation...');
    try {
      const response = await axios.post('/api/explain', {
        language: selectedLanguage,
        specifications,
        repo_url: repoUrl,
        include_comments: includeComments // Pass includeComments
      });
      setExplanation(response.data.explanation);
      setShowExplanation(true);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error generating explanation', severity: 'error' });
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(dockerfile);
    setSnackbar({ open: true, message: 'Dockerfile copied to clipboard!', severity: 'success' });
  };

  return (
    <Container maxWidth="md" sx={{ py: 6, bgcolor: 'background.default', borderRadius: '12px', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <IconButton onClick={colorMode.toggleColorMode} color="inherit">
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Dockerfile Generator
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
        <TextField
          label="Additional Specifications (optional)"
          placeholder="E.g., Use Python 3.11, multi-stage build, etc."
          value={specifications}
          onChange={(e) => {
            if (e.target.value.length <= 2000) setSpecifications(e.target.value);
          }}
          fullWidth
          multiline
          rows={3}
          inputProps={{ maxLength: 2000 }}
          sx={{ mb: 3 }}
          helperText={`${specifications.length}/2000 characters`}
        />
        <TextField
          label="GitHub Repository URL (optional)"
          placeholder="E.g., https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          helperText="Provide a link to your GitHub repository for more precise Dockerfile generation."
        />
        <FormControlLabel
          control={<Checkbox checked={includeComments} onChange={(e) => setIncludeComments(e.target.checked)} />}
          label="Include Comments in Dockerfile"
          sx={{ mb: 3 }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={!selectedLanguage}
            fullWidth
          >
            Generate Dockerfile
          </Button>
          <Button
            variant="outlined"
            onClick={handleExplain}
            disabled={!dockerfile}
            fullWidth
          >
            Explain
          </Button>
        </Box>
      </Paper>

      {dockerfile && (
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {`Generated ${selectedLanguage} Dockerfile:`}
            </Typography>
            <IconButton onClick={handleCopy} size="small">
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

      {showExplanation && explanation && (
        <Paper sx={{ p: 4 }}>
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
            {explanation}
          </Typography>
        </Paper>
      )}

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