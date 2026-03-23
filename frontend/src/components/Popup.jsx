import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Popup = ({ isOpen, message, type = 'info', onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', isConfirm = false }) => {
    const icons = {
        success: <CheckCircle className="text-green-500" size={48} />,
        error: <XCircle className="text-red-500" size={48} />,
        warning: <AlertCircle className="text-yellow-500" size={48} />,
        info: <Info className="text-blue-500" size={48} />
    };

    const bgColors = {
        success: 'bg-green-50',
        error: 'bg-red-50',
        warning: 'bg-yellow-50',
        info: 'bg-blue-50'
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999999,
                    padding: '1rem'
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(8px)'
                        }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '450px',
                            background: 'white',
                            borderRadius: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            overflow: 'hidden',
                            zIndex: 1
                        }}
                    >
                        {/* Status Bar */}
                        <div style={{
                            height: '8px',
                            width: '100%',
                            background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#717fe0'
                        }} />
                        
                        <div style={{ padding: '40px 30px' }}>
                            <button 
                                onClick={onCancel}
                                style={{
                                    position: 'absolute', top: '20px', right: '20px',
                                    border: 'none', background: 'none', cursor: 'pointer',
                                    color: '#bbb', padding: '5px'
                                }}
                            >
                                <X size={20} />
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <motion.div 
                                    initial={{ rotate: -20, scale: 0.5 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    style={{ marginBottom: '25px' }}
                                >
                                    {icons[type]}
                                </motion.div>

                                <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1a1a1a', marginBottom: '15px', textTransform: 'capitalize' }}>
                                    {type}
                                </h3>

                                <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
                                    {message}
                                </p>

                                <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                                    {isConfirm && (
                                        <button
                                            onClick={onCancel}
                                            style={{
                                                flex: 1, padding: '16px 20px', borderRadius: '15px',
                                                border: '2px solid #f3f4f6', background: 'transparent',
                                                color: '#4b5563', fontWeight: '700', cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {cancelText}
                                        </button>
                                    )}
                                    <button
                                        onClick={onConfirm}
                                        style={{
                                            flex: 1, padding: '16px 20px', borderRadius: '15px',
                                            border: 'none', color: 'white', fontWeight: '700', 
                                            cursor: 'pointer', transition: 'all 0.2s',
                                            background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#717fe0',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {confirmText}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Popup;
