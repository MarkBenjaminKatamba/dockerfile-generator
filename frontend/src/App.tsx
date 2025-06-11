import { useState } from 'react';
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
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from 'axios';

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
  const [dockerfile, setDockerfile] = useState('');
  const [explanation, setExplanation] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleLanguageChange = (e: any) => {
    setSelectedLanguage(e.target.value);
    setDockerfile('');
    setExplanation('');
    setShowExplanation(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingMessage('Generating Dockerfile...');
    try {
      const response = await axios.post('/api/generate', { language: selectedLanguage, specifications });
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
      const response = await axios.post('/api/explain', { language: selectedLanguage, specifications });
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Dockerfile Generator
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
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
            if (e.target.value.length <= 200) setSpecifications(e.target.value);
          }}
          fullWidth
          multiline
          inputProps={{ maxLength: 200 }}
          sx={{ mb: 2 }}
          helperText={`${specifications.length}/200 characters`}
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
      </Box>

      {dockerfile && (
        <Paper sx={{ p: 2, mb: 2, position: 'relative' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
              bgcolor: 'grey.100',
              borderRadius: 1,
              overflowX: 'auto',
              fontFamily: 'monospace',
            }}
          >
            {dockerfile}
          </Box>
        </Paper>
      )}

      {showExplanation && explanation && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Explanation
          </Typography>
          <Typography
            component="div"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
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