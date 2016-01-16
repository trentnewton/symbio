<div id="top" class="off-canvas-wrapper docs-wrap">
  <div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>
    <div class="off-canvas position-left" id="offCanvas" data-off-canvas>
      <?php include ($directory."/partials/off-canvas-menu.php"); ?>
    </div>
    <div class="off-canvas-content" data-off-canvas-content>
      <main id="main-wrapper">
        <?php include ($directory."/partials/header.php"); ?>
      <?php if(!drupal_is_front_page()):?>
        <section id="masthead" role="banner">
          <div class="row column">
            <?php if ($page['masthead']): ?>
            <div class="page-title enter-bottom">
              <?php print render($page['masthead']); ?>
            </div>
            <?php endif; ?>
            <div class="masthead-nav-container">
              <div class="masthead-nav enter-bottom-1">
                <nav class="tab-links">
                  <a href="#first-section"><?php print render( $node->field_about_first_section_title["und"][0]["value"] ); ?></a>
                  <a href="#second-section"><?php print render( $node->field_about_second_section_title["und"][0]["value"] ); ?></a>
                  <a href="#third-section"><?php print render( $node->field_about_third_section_title["und"][0]["value"] ); ?></a>
                </nav>
              </div>
            </div>
          </div>
        </section>
        <?php if ($page['search']): ?>
        <section id="search-box">
          <?php print render($page['search']); ?>
        </section>
        <?php endif; ?>
        <?php if ($messages || $tabs) : ?>
        <section class="regular-page">
          <div class="row column">
            <?php print $messages; ?>
            <div class="tabs-wrapper">
              <?php print render($tabs); ?>
            </div>
          </div>
        </section>
        <?php endif; ?>
        <?php if ($page['content']): ?>
        <div class="about-page-container" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
          <div class="row column">
            <?php print render($page['content']); ?>
          </div>
        </div>
        <?php endif; ?>
      <?php endif;?>
      </main>
      <?php include ($directory."/partials/footer.php"); ?>
    </div>
  </div>
</div>