"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TimeMachineScene } from './TimeMachineScene';

export function CosmicTimeMachine() {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-50 w-full h-screen bg-[#020617] overflow-hidden"
    >
      <TimeMachineScene />
    </motion.section>
  );
}
