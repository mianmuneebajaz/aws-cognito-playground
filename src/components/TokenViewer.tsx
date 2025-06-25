import React, { useState } from 'react';
import { Eye, EyeOff, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { AuthTokens } from '../types';
import { decodeToken, formatTokenExpiry } from '../utils/tokenDecoder';

interface TokenViewerProps {
  tokens: AuthTokens;
}

export const TokenViewer: React.FC<TokenViewerProps> = ({ tokens }) => {
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const toggleTokenVisibility = (tokenType: string) => {
    setShowTokens(prev => ({ ...prev, [tokenType]: !prev[tokenType] }));
  };

  const copyToClipboard = async (text: string, tokenType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(tokenType);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const renderToken = (tokenName: string, token: string | undefined) => {
    if (!token) return null;

    const isVisible = showTokens[tokenName];
    const decodedToken = decodeToken(token);
    const isValidToken = decodedToken !== null;

    return (
      <div key={tokenName} className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-slate-900">{tokenName} Token</h4>
            {!isValidToken && (
              <div className="flex items-center space-x-1 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">Invalid JWT</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleTokenVisibility(tokenName)}
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-800"
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-sm">{isVisible ? 'Hide' : 'Show'}</span>
            </button>
            <button
              onClick={() => copyToClipboard(token, tokenName)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              {copiedToken === tokenName ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="text-sm">
                {copiedToken === tokenName ? 'Copied!' : 'Copy'}
              </span>
            </button>
          </div>
        </div>

        {decodedToken && (
          <div className="mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-700">Algorithm:</span>
                <p className="text-slate-900">{decodedToken.header.alg}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700">Type:</span>
                <p className="text-slate-900">{decodedToken.header.typ}</p>
              </div>
              {decodedToken.payload.exp && (
                <div className="col-span-2">
                  <span className="font-medium text-slate-700">Expires:</span>
                  <p className="text-slate-900">{formatTokenExpiry(decodedToken.payload.exp)}</p>
                </div>
              )}
              {decodedToken.payload.iat && (
                <div className="col-span-2">
                  <span className="font-medium text-slate-700">Issued At:</span>
                  <p className="text-slate-900">{new Date(decodedToken.payload.iat * 1000).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <span className="text-sm font-medium text-slate-700">Raw Token:</span>
          <div className="mt-1 p-2 bg-slate-50 rounded border text-xs font-mono break-all max-h-20 overflow-y-auto">
            {isVisible ? token : '••••••••••••••••••••••••••••••••••••••••••••'}
          </div>
        </div>

        {decodedToken && isVisible && (
          <div className="mt-3">
            <span className="text-sm font-medium text-slate-700">Decoded Payload:</span>
            <pre className="mt-1 p-2 bg-slate-50 rounded border text-xs overflow-x-auto max-h-40 overflow-y-auto">
              {JSON.stringify(decodedToken.payload, null, 2)}
            </pre>
          </div>
        )}

        {!isValidToken && isVisible && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
            <p className="text-xs text-amber-700">
              This appears to be an error message or invalid token format rather than a valid JWT.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderToken('ID', tokens.idToken)}
      {renderToken('Access', tokens.accessToken)}
      {renderToken('Refresh', tokens.refreshToken)}
      
      {!tokens.idToken && !tokens.accessToken && !tokens.refreshToken && (
        <div className="text-center py-4 text-slate-500">
          <p>No tokens available</p>
          <p className="text-sm mt-1">Tokens will appear here after successful authentication</p>
        </div>
      )}
    </div>
  );
};