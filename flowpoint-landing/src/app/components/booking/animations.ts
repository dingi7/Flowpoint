export const slideAnimation = {
  initial: () => ({
      scale: 0.95,
      opacity: 0,
      width: '100%',
  }),
  animate: {
      scale: 1,
      opacity: 1,
      width: '100%',
  },
  exit: () => ({
      scale: 0.95,
      opacity: 0,
      width: '100%',
  }),
};

export const userInfoAnimation = {
  initial: {
      scale: 0.95,
      opacity: 0,
      width: '100%',
  },
  animate: {
      scale: 1,
      opacity: 1,
      width: '100%',
  },
  exit: {
      scale: 0.95,
      opacity: 0,
      width: '100%',
  },
};
