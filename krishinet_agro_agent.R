# ==============================================================================
# KrishiNet: Model-Based Reflex Agent for Precision Agriculture in R
# Components:
#   1. 1D Scalar Kalman Filter (Capacitive Soil Sensor Noise Suppression)
#   2. MDP State Discretization & Q-Learning Engine (Bellman Optimality)
#   3. Model-Based Reflex Safety Layer (Indian Hardware & Climate Arbitration)
#   4. Dynamic Yield & Crop Water Stress Index (CWSI) Model
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Kalman Filter Class (S3 Implementation)
# ------------------------------------------------------------------------------
create_kalman_filter <- function(init_estimate = 25.0, q_process = 0.04, r_measurement = 0.75) {
  structure(
    list(
      x = as.numeric(init_estimate), # State estimate (volumetric water content %)
      p = 1.0,                       # Estimation error covariance
      q = as.numeric(q_process),     # Process noise covariance
      r = as.numeric(r_measurement), # Measurement noise covariance
      k = 0.0                        # Kalman gain
    ),
    class = "KalmanFilter"
  )
}

update_kalman <- function(kf, raw_measurement) {
  # Time Update (Predict step)
  kf$p <- kf$p + kf$q
  
  # Measurement Update (Correction step)
  kf$k <- kf$p / (kf$p + kf$r)
  kf$x <- kf$x + kf$k * (raw_measurement - kf$x)
  kf$p <- (1.0 - kf$k) * kf$p
  
  return(kf)
}

# ------------------------------------------------------------------------------
# 2. MDP Action Space & State Discretization
# ------------------------------------------------------------------------------
ACTIONS <- c(
  "IDLE_MONITOR",
  "PULSE_DRIP_IRRIGATION",
  "DEEP_DRIP_SOAK",
  "FERTIGATION_VENTURI_NPK",
  "CANOPY_MICRO_MIST"
)

discretize_state <- function(moisture, nitrogen, vpd) {
  m_tier <- if (moisture < 22.0) "DRY" else if (moisture <= 32.0) "OPTIMAL" else "SATURATED"
  n_tier <- if (nitrogen < 170.0) "LOW_N" else if (nitrogen <= 220.0) "BALANCED_N" else "HIGH_N"
  v_tier <- if (vpd > 2.0) "HIGH_VPD" else "LOW_VPD"
  
  paste(m_tier, n_tier, v_tier, sep = "__")
}

# ------------------------------------------------------------------------------
# 3. Model-Based Reflex Safety Layer (Indian Hardware & Climate Arbitration)
# ------------------------------------------------------------------------------
# Fast-path safety overrides supervising the RL agent
evaluate_reflex_rules <- function(moisture, grid_voltage, phase_fault, rain_rate, canopy_temp, ambient_temp) {
  # Rule 1: Indian 3-Phase single-phasing or voltage drop protection (< 330V)
  if (phase_fault || grid_voltage < 330.0) {
    return(list(
      override = TRUE,
      action = "IDLE_MONITOR",
      reason = sprintf("SAFETY TRIP: Feeder phase fault or low voltage (%.0fV < 340V). Protect motor winding.", grid_voltage)
    ))
  }
  
  # Rule 2: Torrential Monsoon Rain (> 10 mm/hr)
  if (rain_rate > 10.0) {
    return(list(
      override = TRUE,
      action = "IDLE_MONITOR",
      reason = sprintf("OPTIMIZATION: Monsoon precipitation detected at %.1f mm/hr. Drip valves closed.", rain_rate)
    ))
  }
  
  # Rule 3: Critical root-zone water deficit emergency (< 14%)
  if (moisture < 14.0) {
    return(list(
      override = TRUE,
      action = "DEEP_DRIP_SOAK",
      reason = sprintf("EMERGENCY REFLEX: Root moisture at critical wilting point (%.1f%%). Immediate soak override.", moisture)
    ))
  }
  
  # Rule 4: Extreme thermal shock (Canopy temp > 39°C & Tc - Ta > 3.0°C)
  if (canopy_temp > 39.0 && (canopy_temp - ambient_temp) > 3.0) {
    return(list(
      override = TRUE,
      action = "CANOPY_MICRO_MIST",
      reason = sprintf("THERMAL RELIEF: Canopy heat spike at %.1f C vs ambient %.1f C. Deploying micro-mist.", canopy_temp, ambient_temp)
    ))
  }
  
  return(list(override = FALSE, action = NULL, reason = NULL))
}

# ------------------------------------------------------------------------------
# 4. Q-Learning Engine (Tabular Markov Decision Process)
# ------------------------------------------------------------------------------
create_ql_agent <- function(alpha = 0.25, gamma = 0.90, epsilon = 0.15) {
  states <- c(
    "DRY__LOW_N__HIGH_VPD", "DRY__LOW_N__LOW_VPD",
    "DRY__BALANCED_N__HIGH_VPD", "DRY__BALANCED_N__LOW_VPD",
    "DRY__HIGH_N__HIGH_VPD", "DRY__HIGH_N__LOW_VPD",
    "OPTIMAL__LOW_N__HIGH_VPD", "OPTIMAL__LOW_N__LOW_VPD",
    "OPTIMAL__BALANCED_N__HIGH_VPD", "OPTIMAL__BALANCED_N__LOW_VPD",
    "OPTIMAL__HIGH_N__HIGH_VPD", "OPTIMAL__HIGH_N__LOW_VPD",
    "SATURATED__LOW_N__HIGH_VPD", "SATURATED__LOW_N__LOW_VPD",
    "SATURATED__BALANCED_N__HIGH_VPD", "SATURATED__BALANCED_N__LOW_VPD",
    "SATURATED__HIGH_N__HIGH_VPD", "SATURATED__HIGH_N__LOW_VPD"
  )
  
  q_table <- matrix(
    0.0,
    nrow = length(states),
    ncol = length(ACTIONS),
    dimnames = list(states, ACTIONS)
  )
  
  structure(
    list(
      q_table = q_table,
      alpha = as.numeric(alpha),
      gamma = as.numeric(gamma),
      epsilon = as.numeric(epsilon)
    ),
    class = "QLearningAgent"
  )
}

# Epsilon-Greedy Action Selection
select_action <- function(agent, state_key, explore = TRUE) {
  if (explore && runif(1) < agent$epsilon) {
    chosen_action <- sample(ACTIONS, 1)
    is_exploration <- TRUE
  } else {
    state_qs <- agent$q_table[state_key, ]
    max_val <- max(state_qs)
    best_actions <- names(state_qs)[state_qs == max_val]
    chosen_action <- if (length(best_actions) == 1) best_actions else sample(best_actions, 1)
    is_exploration <- FALSE
  }
  
  list(action = chosen_action, is_exploration = is_exploration)
}

# Multi-Objective Reward Function
compute_reward <- function(prev_m, next_m, next_n, vpd, action, cwsi) {
  reward <- 0.0
  
  # Target root moisture is 24% - 32%
  if (next_m >= 24.0 && next_m <= 32.0) {
    reward <- reward + 10.0
  } else if (next_m < 20.0) {
    reward <- reward - (20.0 - next_m) * 2.5
  } else if (next_m > 36.0) {
    reward <- reward - (next_m - 36.0) * 3.0 # Penalty for waterlogging
  }
  
  # Crop Water Stress Index penalty (CWSI in [0, 1])
  reward <- reward - (cwsi * 8.0)
  
  # Nitrogen target 180 - 220 ppm
  if (next_n >= 180.0 && next_n <= 220.0) {
    reward <- reward + 5.0
  }
  
  # Actuation energy cost
  if (action %in% c("PULSE_DRIP_IRRIGATION", "DEEP_DRIP_SOAK", "FERTIGATION_VENTURI_NPK")) {
    reward <- reward - 1.5
  }
  
  return(reward)
}

# Bellman Equation Q-Update
update_q <- function(agent, s, a, r, s_prime) {
  current_q <- agent$q_table[s, a]
  max_next_q <- max(agent$q_table[s_prime, ])
  td_error <- r + (agent$gamma * max_next_q) - current_q
  
  agent$q_table[s, a] <- current_q + (agent$alpha * td_error)
  list(agent = agent, td_error = td_error)
}

# ------------------------------------------------------------------------------
# 5. Simulation Demonstration Execution
# ------------------------------------------------------------------------------
run_krishinet_simulation <- function(steps = 20) {
  cat("\n===================================================================\n")
  cat("  KRISHINET AGRO-AGENT SIMULATION: KALMAN + REFLEX + Q-LEARNING\n")
  cat("===================================================================\n\n")
  
  kf <- create_kalman_filter(init_estimate = 22.0)
  agent <- create_ql_agent()
  
  # Initial environment telemetry
  true_moisture <- 20.5   # % Volumetric Water Content
  true_nitrogen <- 165.0  # mg/kg (ppm)
  ambient_temp  <- 33.5   # deg C
  vpd           <- 2.4    # kPa
  line_voltage  <- 400.0  # Volts (3-phase)
  phase_fault   <- FALSE
  rain_rate     <- 0.0    # mm/hr
  projected_yield <- 45.0 # quintals/hectare
  
  log_records <- data.frame(
    Step = integer(steps),
    Raw_M = numeric(steps),
    Kalman_M = numeric(steps),
    Action = character(steps),
    Reflex = character(steps),
    Reward = numeric(steps),
    Yield = numeric(steps),
    stringsAsFactors = FALSE
  )
  
  for (t in 1:steps) {
    # 1. Soil evaporation & natural drainage
    true_moisture <- max(10.0, true_moisture - 0.45)
    
    # 2. Add electromagnetic sensor noise
    noise <- rnorm(1, mean = 0, sd = 1.4)
    raw_measured <- max(5.0, min(50.0, true_moisture + noise))
    
    # 3. Kalman Filter update
    kf <- update_kalman(kf, raw_measured)
    kalman_moisture <- kf$x
    
    # 4. Thermal leaf computation & Crop Water Stress Index (CWSI)
    canopy_temp <- ambient_temp + if (kalman_moisture < 22.0) 2.0 else -1.0
    cwsi <- max(0.1, min(0.95, (32.0 - kalman_moisture) / 18.0))
    
    # Inject a simulated grid fault at Step 8
    if (t == 8) {
      phase_fault <- TRUE
      line_voltage <- 280.0
    } else if (t == 9) {
      phase_fault <- FALSE
      line_voltage <- 410.0
    }
    
    # 5. Reflex Arbitration Layer
    reflex <- evaluate_reflex_rules(
      kalman_moisture, line_voltage, phase_fault, rain_rate, canopy_temp, ambient_temp
    )
    
    state_key <- discretize_state(kalman_moisture, true_nitrogen, vpd)
    
    if (reflex$override) {
      selected_action <- reflex$action
      action_source <- "REFLEX_OVERRIDE"
    } else {
      action_res <- select_action(agent, state_key, explore = TRUE)
      selected_action <- action_res$action
      action_source <- if (action_res$is_exploration) "Q_EXPLORE" else "Q_EXPLOIT"
    }
    
    # 6. Actuation state transition
    if (selected_action == "PULSE_DRIP_IRRIGATION") {
      true_moisture <- min(36.0, true_moisture + 3.2)
    } else if (selected_action == "DEEP_DRIP_SOAK") {
      true_moisture <- min(42.0, true_moisture + 6.8)
    } else if (selected_action == "FERTIGATION_VENTURI_NPK") {
      true_moisture <- min(36.0, true_moisture + 2.4)
      true_nitrogen <- min(240.0, true_nitrogen + 22.0)
    }
    
    # 7. Reward & Bellman Q-Update
    next_state_key <- discretize_state(true_moisture, true_nitrogen, vpd)
    reward <- compute_reward(kalman_moisture, true_moisture, true_nitrogen, vpd, selected_action, cwsi)
    
    if (!reflex$override) {
      q_res <- update_q(agent, state_key, selected_action, reward, next_state_key)
      agent <- q_res$agent
    }
    
    # 8. Dynamic Yield refinement (Corrected variable name: stress_penalty)
    stress_penalty <- if (cwsi > 0.5) 0.08 else -0.04
    projected_yield <- max(30.0, min(58.0, projected_yield - stress_penalty))
    
    # Log record
    log_records[t, ] <- list(
      Step = t,
      Raw_M = round(raw_measured, 2),
      Kalman_M = round(kalman_moisture, 2),
      Action = selected_action,
      Reflex = action_source,
      Reward = round(reward, 2),
      Yield = round(projected_yield, 2)
    )
    
    cat(sprintf(
      "[%02d] Raw: %5.2f%% | Kalman: %5.2f%% | %-24s | %-16s | Reward: %+5.2f | Yield: %4.1f q/ha\n",
      t, raw_measured, kalman_moisture, selected_action, action_source, reward, projected_yield
    ))
    if (reflex$override) {
      cat(sprintf("     └─> [Trigger]: %s\n", reflex$reason))
    }
  }
  
  cat("\n===================================================================\n")
  cat("  Learned Q-Values for DRY State Matrix:\n")
  cat("===================================================================\n")
  print(round(agent$q_table["DRY__LOW_N__HIGH_VPD", ], 2))
  
  invisible(list(agent = agent, logs = log_records))
}

# Run the simulation
sim_results <- run_krishinet_simulation(15)
