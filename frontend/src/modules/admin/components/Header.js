export function Header() {
	return `
    <nav class="navbar navbar-expand-lg p-0">
							<ul class="navbar-nav">
								<li class="nav-item nav-icon-hover-bg rounded-circle ms-n2">
									<a
										class="nav-link sidebartoggler"
										id="headerCollapse"
										href="javascript:void(0)"
									>
										<i class="ti ti-menu-2"></i>
									</a>
								</li>
							</ul>

							<div class="d-block d-lg-none py-4">
								<a href="../main/index.html" class="text-nowrap logo-img">
									<img
										src="/src/assets/images/logo-rudo-watch-horizontal.svg"
										class="dark-logo"
										width="100"
										alt="Logo-Dark"
									/>
									<img
										src="/src/assets/images/logo-rudo-watch.svg"
										class="light-logo"
										width="100"
										alt="Logo-light"
										style="display: none"
									/>
								</a>
							</div>
							<a
								class="navbar-toggler nav-icon-hover-bg rounded-circle p-0 mx-0 border-0"
								href="javascript:void(0)"
								data-bs-toggle="collapse"
								data-bs-target="#navbarNav"
								aria-controls="navbarNav"
								aria-expanded="false"
								aria-label="Toggle navigation"
							>
								<i class="ti ti-dots fs-7"></i>
							</a>
							<div
								class="collapse navbar-collapse justify-content-end"
								id="navbarNav"
							>
								<div class="d-flex align-items-center justify-content-between">
									<a
										href="javascript:void(0)"
										class="nav-link nav-icon-hover-bg rounded-circle mx-0 ms-n1 d-flex d-lg-none align-items-center justify-content-center"
										type="button"
										data-bs-toggle="offcanvas"
										data-bs-target="#mobilenavbar"
										aria-controls="offcanvasWithBothOptions"
									>
										<i class="ti ti-align-justified fs-7"></i>
									</a>
									<ul
										class="navbar-nav flex-row ms-auto align-items-center justify-content-center"
									>
										<!-- ------------------------------- -->
										<!-- start language Dropdown -->
										<!-- ------------------------------- -->
										<li class="nav-item nav-icon-hover-bg rounded-circle">
											<a
												class="nav-link moon dark-layout"
												href="javascript:void(0)"
												style="display: flex"
											>
												<i class="ti ti-moon moon" style="display: flex"></i>
											</a>
											<a
												class="nav-link sun light-layout"
												href="javascript:void(0)"
												style="display: none"
											>
												<i class="ti ti-sun sun" style="display: none"></i>
											</a>
										</li>
										<li
											class="nav-item nav-icon-hover-bg rounded-circle dropdown"
										>
											<a
												class="nav-link"
												href="javascript:void(0)"
												id="drop2"
												aria-expanded="false"
											>
												<img
													src="../assets/images/svgs/icon-flag-en.svg"
													alt="modernize-img"
													width="20px"
													height="20px"
													class="rounded-circle object-fit-cover round-20"
												/>
											</a>
											<div
												class="dropdown-menu dropdown-menu-end dropdown-menu-animate-up"
												aria-labelledby="drop2"
											>
												<div class="message-body">
													<a
														href="javascript:void(0)"
														class="d-flex align-items-center gap-2 py-3 px-4 dropdown-item"
													>
														<div class="position-relative">
															<img
																src="../assets/images/svgs/icon-flag-en.svg"
																alt="modernize-img"
																width="20px"
																height="20px"
																class="rounded-circle object-fit-cover round-20"
															/>
														</div>
														<p class="mb-0 fs-3">English (UK)</p>
													</a>
													<a
														href="javascript:void(0)"
														class="d-flex align-items-center gap-2 py-3 px-4 dropdown-item"
													>
														<div class="position-relative">
															<img
																src="../assets/images/svgs/icon-flag-cn.svg"
																alt="modernize-img"
																width="20px"
																height="20px"
																class="rounded-circle object-fit-cover round-20"
															/>
														</div>
														<p class="mb-0 fs-3">中国人 (Chinese)</p>
													</a>
												</div>
											</div>
										</li>
										<!-- ------------------------------- -->
										<!-- end language Dropdown -->
										<!-- ------------------------------- -->

										<!-- ------------------------------- -->
										<!-- start notification Dropdown -->
										<!-- ------------------------------- -->
										<li
											class="nav-item nav-icon-hover-bg rounded-circle dropdown"
										>
											<a
												class="nav-link position-relative"
												href="javascript:void(0)"
												id="drop2"
												aria-expanded="false"
											>
												<i class="ti ti-bell-ringing"></i>
												<div
													class="notification bg-primary rounded-circle"
												></div>
											</a>
											<div
												class="dropdown-menu content-dd dropdown-menu-end dropdown-menu-animate-up"
												aria-labelledby="drop2"
											>
												<div
													class="d-flex align-items-center justify-content-between py-3 px-7"
												>
													<h5 class="mb-0 fs-5 fw-semibold">Notifications</h5>
													<span
														class="badge text-bg-primary rounded-4 px-3 py-1 lh-sm"
														>5 new</span
													>
												</div>
												<div class="message-body" data-simplebar="init">
													<div class="simplebar-wrapper" style="margin: 0px">
														<div class="simplebar-height-auto-observer-wrapper">
															<div class="simplebar-height-auto-observer"></div>
														</div>
														<div class="simplebar-mask">
															<div
																class="simplebar-offset"
																style="right: 0px; bottom: 0px"
															>
																<div
																	class="simplebar-content-wrapper"
																	tabindex="0"
																	role="region"
																	aria-label="scrollable content"
																	style="height: auto; overflow: hidden"
																>
																	<div
																		class="simplebar-content"
																		style="padding: 0px"
																	>
																		<a
																			href="javascript:void(0)"
																			class="py-6 px-7 d-flex align-items-center dropdown-item"
																		>
																			<span class="me-3">
																				<img
																					src="../assets/images/profile/user-2.jpg"
																					alt="user"
																					class="rounded-circle"
																					width="48"
																					height="48"
																				/>
																			</span>
																			<div class="w-100">
																				<h6 class="mb-1 fw-semibold lh-base">
																					Roman Joined the Team!
																				</h6>
																				<span
																					class="fs-2 d-block text-body-secondary"
																					>Congratulate him</span
																				>
																			</div>
																		</a>
																		<a
																			href="javascript:void(0)"
																			class="py-6 px-7 d-flex align-items-center dropdown-item"
																		>
																			<span class="me-3">
																				<img
																					src="../assets/images/profile/user-3.jpg"
																					alt="user"
																					class="rounded-circle"
																					width="48"
																					height="48"
																				/>
																			</span>
																			<div class="w-100">
																				<h6 class="mb-1 fw-semibold lh-base">
																					New message
																				</h6>
																				<span
																					class="fs-2 d-block text-body-secondary"
																					>Salma sent you new message</span
																				>
																			</div>
																		</a>
																		<a
																			href="javascript:void(0)"
																			class="py-6 px-7 d-flex align-items-center dropdown-item"
																		>
																			<span class="me-3">
																				<img
																					src="../assets/images/profile/user-4.jpg"
																					alt="user"
																					class="rounded-circle"
																					width="48"
																					height="48"
																				/>
																			</span>
																			<div class="w-100">
																				<h6 class="mb-1 fw-semibold lh-base">
																					Bianca sent payment
																				</h6>
																				<span
																					class="fs-2 d-block text-body-secondary"
																					>Check your earnings</span
																				>
																			</div>
																		</a>
																		<a
																			href="javascript:void(0)"
																			class="py-6 px-7 d-flex align-items-center dropdown-item"
																		>
																			<span class="me-3">
																				<img
																					src="../assets/images/profile/user-5.jpg"
																					alt="user"
																					class="rounded-circle"
																					width="48"
																					height="48"
																				/>
																			</span>
																			<div class="w-100">
																				<h6 class="mb-1 fw-semibold lh-base">
																					Jolly completed tasks
																				</h6>
																				<span
																					class="fs-2 d-block text-body-secondary"
																					>Assign her new tasks</span
																				>
																			</div>
																		</a>
																		<a
																			href="javascript:void(0)"
																			class="py-6 px-7 d-flex align-items-center dropdown-item"
																		>
																			<span class="me-3">
																				<img
																					src="../assets/images/profile/user-6.jpg"
																					alt="user"
																					class="rounded-circle"
																					width="48"
																					height="48"
																				/>
																			</span>
																			<div class="w-100">
																				<h6 class="mb-1 fw-semibold lh-base">
																					John received payment
																				</h6>
																				<span
																					class="fs-2 d-block text-body-secondary"
																					>$230 deducted from account</span
																				>
																			</div>
																		</a>
																		<a
																			href="javascript:void(0)"
																			class="py-6 px-7 d-flex align-items-center dropdown-item"
																		>
																			<span class="me-3">
																				<img
																					src="../assets/images/profile/user-7.jpg"
																					alt="user"
																					class="rounded-circle"
																					width="48"
																					height="48"
																				/>
																			</span>
																			<div class="w-100">
																				<h6 class="mb-1 fw-semibold lh-base">
																					Roman Joined the Team!
																				</h6>
																				<span
																					class="fs-2 d-block text-body-secondary"
																					>Congratulate him</span
																				>
																			</div>
																		</a>
																	</div>
																</div>
															</div>
														</div>
														<div
															class="simplebar-placeholder"
															style="width: 0px; height: 0px"
														></div>
													</div>
													<div
														class="simplebar-track simplebar-horizontal"
														style="visibility: hidden"
													>
														<div
															class="simplebar-scrollbar"
															style="width: 0px; display: none"
														></div>
													</div>
													<div
														class="simplebar-track simplebar-vertical"
														style="visibility: hidden"
													>
														<div
															class="simplebar-scrollbar"
															style="height: 0px; display: none"
														></div>
													</div>
												</div>
												<div class="py-6 px-7 mb-1">
													<button class="btn btn-outline-primary w-100">
														See All Notifications
													</button>
												</div>
											</div>
										</li>
										<!-- ------------------------------- -->
										<!-- end notification Dropdown -->
										<!-- ------------------------------- -->

										<!-- ------------------------------- -->
										<!-- start profile Dropdown -->
										<!-- ------------------------------- -->
										<li class="nav-item dropdown">
											<a
												class="nav-link pe-0"
												href="javascript:void(0)"
												id="drop1"
												aria-expanded="false"
											>
												<div class="d-flex align-items-center">
													<div class="user-profile-img">
														<img
															src="../assets/images/profile/user-1.jpg"
															class="rounded-circle"
															width="35"
															height="35"
															alt="modernize-img"
														/>
													</div>
												</div>
											</a>
											<div
												class="dropdown-menu content-dd dropdown-menu-end dropdown-menu-animate-up"
												aria-labelledby="drop1"
											>
												<div
													class="profile-dropdown position-relative"
													data-simplebar="init"
												>
													<div class="simplebar-wrapper" style="margin: 0px">
														<div class="simplebar-height-auto-observer-wrapper">
															<div class="simplebar-height-auto-observer"></div>
														</div>
														<div class="simplebar-mask">
															<div
																class="simplebar-offset"
																style="right: 0px; bottom: 0px"
															>
																<div
																	class="simplebar-content-wrapper"
																	tabindex="0"
																	role="region"
																	aria-label="scrollable content"
																	style="height: auto; overflow: hidden"
																>
																	<div
																		class="simplebar-content"
																		style="padding: 0px"
																	>
																		<div class="py-3 px-7 pb-0">
																			<h5 class="mb-0 fs-5 fw-semibold">
																				User Profile
																			</h5>
																		</div>
																		<div
																			class="d-flex align-items-center py-9 mx-7 border-bottom"
																		>
																			<img
																				src="../assets/images/profile/user-1.jpg"
																				class="rounded-circle"
																				width="80"
																				height="80"
																				alt="modernize-img"
																			/>
																			<div class="ms-3">
																				<h5 class="mb-1 fs-3">
																					Mathew Anderson
																				</h5>
																				<span class="mb-1 d-block"
																					>Designer</span
																				>
																				<p
																					class="mb-0 d-flex align-items-center gap-2"
																				>
																					<i class="ti ti-mail fs-4"></i>
																					info@modernize.com
																				</p>
																			</div>
																		</div>
																		<div class="message-body">
																			<a
																				href="../main/page-user-profile.html"
																				class="py-8 px-7 mt-8 d-flex align-items-center"
																			>
																				<span
																					class="d-flex align-items-center justify-content-center text-bg-light rounded-1 p-6"
																				>
																					<img
																						src="../assets/images/svgs/icon-account.svg"
																						alt="modernize-img"
																						width="24"
																						height="24"
																					/>
																				</span>
																				<div class="w-100 ps-3">
																					<h6
																						class="mb-1 fs-3 fw-semibold lh-base"
																					>
																						My Profile
																					</h6>
																					<span
																						class="fs-2 d-block text-body-secondary"
																						>Account Settings</span
																					>
																				</div>
																			</a>
																			<a
																				href="../main/app-email.html"
																				class="py-8 px-7 d-flex align-items-center"
																			>
																				<span
																					class="d-flex align-items-center justify-content-center text-bg-light rounded-1 p-6"
																				>
																					<img
																						src="../assets/images/svgs/icon-inbox.svg"
																						alt="modernize-img"
																						width="24"
																						height="24"
																					/>
																				</span>
																				<div class="w-100 ps-3">
																					<h6
																						class="mb-1 fs-3 fw-semibold lh-base"
																					>
																						My Inbox
																					</h6>
																					<span
																						class="fs-2 d-block text-body-secondary"
																						>Messages &amp; Emails</span
																					>
																				</div>
																			</a>
																			<a
																				href="../main/app-notes.html"
																				class="py-8 px-7 d-flex align-items-center"
																			>
																				<span
																					class="d-flex align-items-center justify-content-center text-bg-light rounded-1 p-6"
																				>
																					<img
																						src="../assets/images/svgs/icon-tasks.svg"
																						alt="modernize-img"
																						width="24"
																						height="24"
																					/>
																				</span>
																				<div class="w-100 ps-3">
																					<h6
																						class="mb-1 fs-3 fw-semibold lh-base"
																					>
																						My Task
																					</h6>
																					<span
																						class="fs-2 d-block text-body-secondary"
																						>To-do and Daily Tasks</span
																					>
																				</div>
																			</a>
																		</div>
																		<div class="d-grid py-4 px-7 pt-8">
																			<div
																				class="upgrade-plan bg-primary-subtle position-relative overflow-hidden rounded-4 p-4 mb-9"
																			>
																				<div class="row">
																					<div class="col-6">
																						<h5 class="fs-4 mb-3 fw-semibold">
																							Unlimited Access
																						</h5>
																						<button class="btn btn-primary">
																							Upgrade
																						</button>
																					</div>
																					<div class="col-6">
																						<div class="m-n4 unlimited-img">
																							<img
																								src="../assets/images/backgrounds/unlimited-bg.png"
																								alt="modernize-img"
																								class="w-100"
																							/>
																						</div>
																					</div>
																				</div>
																			</div>
																			<a
																				href="../main/authentication-login.html"
																				class="btn btn-outline-primary"
																				>Log Out</a
																			>
																		</div>
																	</div>
																</div>
															</div>
														</div>
														<div
															class="simplebar-placeholder"
															style="width: 0px; height: 0px"
														></div>
													</div>
													<div
														class="simplebar-track simplebar-horizontal"
														style="visibility: hidden"
													>
														<div
															class="simplebar-scrollbar"
															style="width: 0px; display: none"
														></div>
													</div>
													<div
														class="simplebar-track simplebar-vertical"
														style="visibility: hidden"
													>
														<div
															class="simplebar-scrollbar"
															style="height: 0px; display: none"
														></div>
													</div>
												</div>
											</div>
										</li>
										<!-- ------------------------------- -->
										<!-- end profile Dropdown -->
										<!-- ------------------------------- -->
									</ul>
								</div>
							</div>
						</nav>
  `;
}

